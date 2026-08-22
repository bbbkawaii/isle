import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { pairScore, fogContrastForPair } from '@/lib/scoring'
import { getIdentity } from '@/lib/content/identities'
import { genMatchNarrative } from '@/lib/llm'
import { overlapOf, blendScore } from '@/lib/vane-match'

// POST /api/like { fromUserId, toUserId }
// 双向心动 → 生成 Match（第二层向量打分 + 第三层 LLM 相遇叙事）
// 演示逻辑：对方是种子岛民时自动双向心动，评委单人也能走通全链路
export async function POST(req: Request) {
  const { fromUserId, toUserId } = await req.json()
  if (!fromUserId || !toUserId) {
    return NextResponse.json({ error: 'fromUserId/toUserId required' }, { status: 400 })
  }
  if (fromUserId === toUserId) {
    return NextResponse.json({ error: 'cannot like self' }, { status: 400 })
  }

  const [me, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: fromUserId }, include: { session: { include: { answers: true } } } }),
    prisma.user.findUnique({ where: { id: toUserId }, include: { session: { include: { answers: true } } } }),
  ])
  if (!me || !target || !me.session || !target.session) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  await prisma.like.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    create: { fromUserId, toUserId },
    update: {},
  })

  // 种子岛民自动回应心动（演示用）
  let reverse = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
  })
  if (!reverse && target.session.deviceToken.startsWith('seed-')) {
    reverse = await prisma.like.create({ data: { fromUserId: toUserId, toUserId: fromUserId } })
  }

  if (!reverse) {
    return NextResponse.json({ matched: false })
  }

  // 已有 Match 直接返回
  const [a, b] = [fromUserId, toUserId].sort()
  const existing = await prisma.match.findUnique({ where: { userAId_userBId: { userAId: a, userBId: b } } })
  if (existing) {
    return NextResponse.json({ matched: true, matchId: existing.id })
  }

  const myAnswers = me.session.answers.map((x) => ({ sceneNo: x.sceneNo, optionId: x.optionId }))
  const theirAnswers = target.session.answers.map((x) => ({ sceneNo: x.sceneNo, optionId: x.optionId }))
  const myReport = await prisma.report.findUnique({ where: { sessionId: me.session.id } })
  const theirReport = await prisma.report.findUnique({ where: { sessionId: target.session.id } })
  if (!myReport || !theirReport) {
    return NextResponse.json({ error: 'report missing' }, { status: 500 })
  }

  const meIdentity = getIdentity(myReport.identity)!
  const taIdentity = getIdentity(theirReport.identity)!

  const { score: islandScore, reasons } = pairScore(myAnswers, theirAnswers)
  const fog = fogContrastForPair(myAnswers, theirAnswers)

  // 剧情重合度融入配对分数（五幕 60% + 剧情 40%），并把证据写进契合解读
  const [myVane, theirVane] = await Promise.all([
    prisma.vaneAnswer.findMany({ where: { userId: fromUserId } }),
    prisma.vaneAnswer.findMany({ where: { userId: toUserId } }),
  ])
  const overlap = overlapOf(myVane, theirVane)
  const score = blendScore(islandScore, overlap)
  if (overlap.total > 0) {
    reasons.push(`剧情重合度 ${overlap.percent}%——你们在共同玩过的剧情里，${overlap.same}/${overlap.total} 个关键选择一致`)
  }

  const narrative = await genMatchNarrative({
    score,
    nameA: meIdentity.name,
    routineA: meIdentity.routine,
    nameB: taIdentity.name,
    routineB: taIdentity.routine,
    fogVerdict: fog.verdict,
    reasons,
    fallback: `${meIdentity.routine}；${taIdentity.routine}。${fog.verdict}`,
  })

  const match = await prisma.match.create({
    data: {
      userAId: a,
      userBId: b,
      score,
      narrative,
      fogContrast: JSON.stringify({ ...fog, mineUserId: fromUserId, reasons }),
    },
  })

  return NextResponse.json({ matched: true, matchId: match.id })
}
