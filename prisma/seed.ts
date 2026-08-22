// Seed：3 条预置活动 + 21 个假岛民（七种身份 × 3）
// 内容全部来自 src/data/game.json（activities / seed / identities / scenes）
// 上场前跑 npm run demo:reset 一键重置。

import { PrismaClient } from '@prisma/client'
import rawGame from '../src/data/game.json'
import firstDate from '../src/data/vane/first_date.json'
import lifestyle from '../src/data/vane/lifestyle.json'
import values from '../src/data/vane/values.json'
import fenghouNight from '../src/data/vane/fenghou_night.json'

// vane 剧情游戏：提取匹配点（任一选项标 match_point 的 choice 节点）
const VANE_GAMES = [firstDate, lifestyle, values, fenghouNight] as unknown as {
  id: string
  nodes: Record<string, { type: string; options?: { id: string; match_point?: boolean }[] }>
}[]
function vaneMatchPoints(g: (typeof VANE_GAMES)[number]): { nodeId: string; options: string[] }[] {
  return Object.entries(g.nodes)
    .filter(([, n]) => n.type === 'choice' && (n.options ?? []).some((o) => o.match_point))
    .map(([nodeId, n]) => ({ nodeId, options: (n.options ?? []).map((o) => o.id) }))
}
function hashStr(str: string): number {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

type Matrix = Record<string, Record<string, number>>
interface IdentitySeed {
  code: string
  tags: string[]
  fallbackProfile: string
  preview: string
  matrix: Matrix
}
const game = rawGame as unknown as {
  scenes: { no: number; options: { id: number; dim: Record<string, number> }[] }[]
  identities: IdentitySeed[]
  activities: { title: string; timeDesc: string; place: string; icebreak: string; fitTags: string[] }[]
  seed: { nicknames: Record<string, string[]>; cities: string[]; birthYears: number[]; edu: string[]; intents: string[] }
}

const prisma = new PrismaClient()

// 每种身份的典型选择：取判定矩阵中每幕权重最高的选项
function argmaxAnswers(matrix: Matrix): { sceneNo: number; optionId: number }[] {
  return game.scenes.map((s) => {
    const weights = matrix[String(s.no)] ?? {}
    let bestOption = 1
    let bestWeight = -1
    for (const [optionId, w] of Object.entries(weights)) {
      if (w > bestWeight) {
        bestWeight = w
        bestOption = Number(optionId)
      }
    }
    return { sceneNo: s.no, optionId: bestOption }
  })
}

// 与 src/lib/scoring.ts 相同的判定（seed 环境独立实现，避免路径别名）
function classify(answers: { sceneNo: number; optionId: number }[]): string {
  let best = game.identities[game.identities.length - 1].code
  let bestScore = -1
  for (const identity of game.identities) {
    let score = 0
    for (const a of answers) score += identity.matrix[String(a.sceneNo)]?.[String(a.optionId)] ?? 0
    if (score > bestScore) {
      bestScore = score
      best = identity.code
    }
  }
  return best
}

async function main() {
  // 清库（FK 顺序）
  await prisma.invitation.deleteMany()
  await prisma.match.deleteMany()
  await prisma.like.deleteMany()
  await prisma.vaneAnswer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.report.deleteMany()
  await prisma.sceneAnswer.deleteMany()
  await prisma.gameSession.deleteMany()
  await prisma.activity.deleteMany()

  // —— 活动（来自 game.json）——
  for (const a of game.activities) {
    await prisma.activity.create({
      data: { ...a, fitTags: JSON.stringify(a.fitTags) },
    })
  }

  // —— 21 个假岛民 ——
  const { cities, birthYears, edu, intents } = game.seed
  const nicknames = game.seed.nicknames
  let idx = 0
  let femaleCount = 0
  let maleCount = 0
  for (const identity of game.identities) {
    for (let i = 0; i < 3; i++) {
      const gender = idx % 2 === 0 ? 'female' : 'male'
      if (gender === 'female') femaleCount++
      else maleCount++
      const birthYear = birthYears[idx % birthYears.length]
      const city = cities[idx % cities.length]
      const answers = argmaxAnswers(identity.matrix)
      const identityCode = classify(answers) // 存实际判定结果
      const dims: Record<string, number> = {}
      for (const a of answers) {
        const opt = game.scenes.find((s) => s.no === a.sceneNo)!.options.find((o) => o.id === a.optionId)!
        for (const [k, v] of Object.entries(opt.dim)) dims[k] = (dims[k] ?? 0) + v
      }

      const session = await prisma.gameSession.create({
        data: {
          deviceToken: `seed-${identity.code}-${i}`,
          finishedAt: new Date(),
          answers: {
            create: answers.map((a) => ({
              sceneNo: a.sceneNo,
              optionId: a.optionId,
              decisionMs: 3000 + ((idx * 7919) % 9000), // 伪随机犹豫时长
            })),
          },
        },
      })

      await prisma.report.create({
        data: {
          sessionId: session.id,
          identity: identityCode,
          vector: JSON.stringify(dims),
          loveProfile: identity.fallbackProfile,
          tags: JSON.stringify(identity.tags),
          preview: identity.preview,
        },
      })

      const nickname = nicknames[identity.code][i]

      const created = await prisma.user.create({
        data: {
          sessionId: session.id,
          nickname,
          avatar: `/avatars/seed-${identity.code}-${i}.png`, // AI 生成头像（scripts/gen-seed-avatars.ts 产物，随仓库分发）
          gender,
          birthYear,
          city,
          education: edu[idx % edu.length],
          height: gender === 'female' ? 158 + (idx % 9) : 172 + (idx % 10),
          intent: intents[idx % intents.length],
          ageMin: birthYear - 5,
          ageMax: birthYear + 7,
          cityScope: idx % 4 === 3 ? 'any' : 'same_city',
          eduReq: 'none',
          intentMatch: false,
        },
      })

      // 剧情游戏答案：匹配点上确定性伪随机选择（保证不同 NPC 分布不同）
      for (const g of VANE_GAMES) {
        for (const mp of vaneMatchPoints(g)) {
          const opt = mp.options[hashStr(`${nickname}|${g.id}|${mp.nodeId}`) % mp.options.length]
          await prisma.vaneAnswer.create({
            data: { userId: created.id, gameKey: g.id, nodeId: mp.nodeId, optionId: opt },
          })
        }
      }
      idx++
    }
  }

  console.log(`Seed 完成：${game.activities.length} 条活动，${idx} 个岛民（女 ${femaleCount} / 男 ${maleCount}）`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
