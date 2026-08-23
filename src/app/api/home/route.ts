import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getIdentity } from '@/lib/content/identities'
import { getScene, getOption } from '@/lib/content/scenes'
import { pairScore } from '@/lib/scoring'
import { overlapOf, blendScore } from '@/lib/vane-match'
import { resolveStage } from '@/lib/stage'

// GET /api/home?userId=&sessionId=
// 首页聚合接口：阶段判定 + 推荐流/配对列表/关系卡，一次往返取代三次请求

const EDU_LEVEL: Record<string, number> = { high_school: 1, college: 2, bachelor: 3, master: 4, phd: 5 }
const EDU_REQ: Record<string, number> = { none: 0, bachelor: 3, master: 4 }

async function loadMe(id: string) {
  return prisma.user.findUnique({
    where: { id },
    relationLoadStrategy: 'join',
    include: {
      session: { include: { answers: true, report: true } },
      vaneAnswers: true,
      likesSent: { select: { toUserId: true } },
      matchesA: {
        include: {
          invitation: { include: { activity: true } },
          userB: { include: { session: { include: { report: true } } } },
        },
      },
      matchesB: {
        include: {
          invitation: { include: { activity: true } },
          userA: { include: { session: { include: { report: true } } } },
        },
      },
    },
  })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const sessionId = searchParams.get('sessionId')

  const me = userId ? await loadMe(userId) : null
  let sessionReportIdentity = me?.session?.id === sessionId ? me.session.report?.identity ?? null : null
  if (sessionId && me?.session?.id !== sessionId) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      relationLoadStrategy: 'join',
      include: { report: true },
    })
    sessionReportIdentity = session?.report?.identity ?? null
  }
  const { stage, identity: identityCode } = resolveStage({ user: me, sessionReportIdentity })

  const res: Record<string, unknown> = { stage, identity: identityCode }

  if (stage === 'new') {
    // 新用户：一张试读卡
    const seeds = await prisma.user.findMany({
      where: { session: { deviceToken: { startsWith: 'seed-' } } },
      relationLoadStrategy: 'join',
      include: { session: { include: { answers: true, report: true } } },
      take: 12,
    })
    const u = seeds.find((s) => s.session?.report)
    if (u?.session) {
      const identity = getIdentity(u.session.report!.identity)!
      const answer = u.session.answers.find((a) => a.sceneNo === 2) ?? u.session.answers[1]
      const scene = getScene(answer.sceneNo)!
      const opt = getOption(answer.sceneNo, answer.optionId)!
      res.teaser = {
        userId: u.id,
        nickname: u.nickname ?? '匿名岛民',
        avatar: u.avatar,
        city: u.city ?? '',
        age: u.birthYear ? 2026 - u.birthYear : 0,
        identity: { code: identity.code, name: identity.name },
        scene: { title: scene.title, subtitle: scene.subtitle, prompt: scene.prompt },
        choice: { label: opt.label, quote: opt.quote },
      }
    }
    return NextResponse.json(res)
  }

  if (stage === 'played') {
    return NextResponse.json(res)
  }

  if (!me?.session || !me.gender || !me.birthYear) {
    return NextResponse.json({ ...res, matches: [] })
  }

  // —— registered：配对列表 + 关系卡 + 活动卡 ——
  const myAnswers = me.session.answers.map((a) => ({ sceneNo: a.sceneNo, optionId: a.optionId }))
  const myVane = me.vaneAnswers
  const myMatches = [
    ...me.matchesA.map(({ userB, ...match }) => ({ ...match, other: userB })),
    ...me.matchesB.map(({ userA, ...match }) => ({ ...match, other: userA })),
  ]
  const excluded = new Set<string>([me.id, ...me.likesSent.map((l) => l.toUserId), ...myMatches.map((m) => m.other.id)])

  const [pool, activity] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { notIn: [...excluded] },
        gender: me.gender === 'male' ? 'female' : 'male',
        birthYear: { gte: me.ageMin, lte: me.ageMax, not: null },
        ageMin: { lte: me.birthYear },
        ageMax: { gte: me.birthYear },
        ...(me.cityScope === 'same_city' ? { OR: [{ city: me.city }, { cityScope: 'any' }] } : {}),
      },
      relationLoadStrategy: 'join',
      include: { session: { include: { answers: true, report: true } }, vaneAnswers: true },
    }),
    prisma.activity.findFirst(),
  ])

  res.matches = pool
    .filter((u) => {
      const theirLevel = EDU_LEVEL[u.education ?? ''] ?? 0
      const myLevel = EDU_LEVEL[me.education ?? ''] ?? 0
      return theirLevel >= (EDU_REQ[me.eduReq] ?? 0) && myLevel >= (EDU_REQ[u.eduReq] ?? 0)
    })
    .map((u) => {
      const identity = getIdentity(u.session!.report!.identity)!
      const theirAnswers = u.session!.answers.map((a) => ({ sceneNo: a.sceneNo, optionId: a.optionId }))
      const { score: islandScore } = pairScore(myAnswers, theirAnswers)
      const overlap = overlapOf(myVane, u.vaneAnswers)
      return {
        userId: u.id,
        nickname: u.nickname ?? '匿名岛民',
        age: u.birthYear ? 2026 - u.birthYear : 0,
        city: u.city ?? '',
        height: u.height,
        avatar: u.avatar,
        identity: { code: identity.code, name: identity.name, core: identity.core, tags: identity.tags.slice(0, 2) },
        overlapPercent: overlap.total > 0 ? overlap.percent : null,
        score: blendScore(islandScore, overlap),
      }
    })
    .sort((a, b) => b.score - a.score)

  const m = [...myMatches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
  if (m) {
    const other = m.other
    res.relation = {
      matchId: m.id,
      score: m.score,
      status: m.invitation?.status ?? 'matched',
      activityTitle: m.invitation?.activity.title ?? null,
      other: {
        nickname: other.nickname ?? '匿名岛民',
        avatar: other.avatar,
        identity: { code: getIdentity(other.session!.report!.identity)!.code, name: getIdentity(other.session!.report!.identity)!.name },
      },
    }
  }

  if (activity) {
    res.activity = { id: activity.id, title: activity.title, timeDesc: activity.timeDesc, place: activity.place, icebreak: activity.icebreak }
  }

  return NextResponse.json(res)
}
