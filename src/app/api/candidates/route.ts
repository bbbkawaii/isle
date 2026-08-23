import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { pairScore } from '@/lib/scoring'
import { overlapOf, blendScore } from '@/lib/vane-match'
import { getIdentity } from '@/lib/content/identities'

// GET /api/candidates?userId= —— 第一层：双向硬门槛过滤（航线检查）
const EDU_LEVEL: Record<string, number> = { high_school: 1, college: 2, bachelor: 3, master: 4, phd: 5 }
const EDU_REQ: Record<string, number> = { none: 0, bachelor: 3, master: 4 }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const me = await prisma.user.findUnique({
    where: { id: userId },
    include: { session: { include: { answers: true } } },
  })
  if (!me) return NextResponse.json({ error: 'user not found' }, { status: 404 })
  if (!me.gender || !me.birthYear || !me.session) {
    return NextResponse.json({ error: '请先填写资料' }, { status: 400 })
  }

  const myAnswers = me.session.answers.map((a) => ({ sceneNo: a.sceneNo, optionId: a.optionId }))

  // 已互动过的人（心动过或已匹配）排除
  const liked = await prisma.like.findMany({ where: { fromUserId: me.id }, select: { toUserId: true } })
  const myMatches = await prisma.match.findMany({ where: { OR: [{ userAId: me.id }, { userBId: me.id }] } })
  const excluded = new Set<string>([me.id, ...liked.map((l) => l.toUserId), ...myMatches.map((m) => (m.userAId === me.id ? m.userBId : m.userAId))])

  const pool = await prisma.user.findMany({
    where: {
      id: { notIn: [...excluded] },
      gender: me.gender === 'male' ? 'female' : 'male',
      // 双向年龄：对方在我的区间，我也在对方的区间
      birthYear: { gte: me.ageMin, lte: me.ageMax, not: null },
      ageMin: { lte: me.birthYear },
      ageMax: { gte: me.birthYear },
      // 城市双向：我要同城 → 对方同城或对方不限；对方要同城 → 城市相等已覆盖
      ...(me.cityScope === 'same_city' ? { OR: [{ city: me.city }, { cityScope: 'any' }] } : {}),
    },
    include: { session: { include: { answers: true, report: true } }, vaneAnswers: true },
  })

  // 我的剧情游戏答案（用于重合度融合）
  const myVane = await prisma.vaneAnswer.findMany({ where: { userId: me.id } })

  const candidates = pool
    // 学历双向判定（映射数值后交叉比较）
    .filter((u) => {
      const theirLevel = EDU_LEVEL[u.education ?? ''] ?? 0
      const myLevel = EDU_LEVEL[me.education ?? ''] ?? 0
      return theirLevel >= (EDU_REQ[me.eduReq] ?? 0) && myLevel >= (EDU_REQ[u.eduReq] ?? 0)
    })
    .map((u) => {
      const theirAnswers = u.session!.answers.map((a) => ({ sceneNo: a.sceneNo, optionId: a.optionId }))
      const identity = getIdentity(u.session!.report!.identity)!
      // 契合指数 = 五幕契合 60% + 共同剧情游戏的重合度 40%（没一起玩过则纯五幕）
      const { score: islandScore } = pairScore(myAnswers, theirAnswers)
      const overlap = overlapOf(myVane, u.vaneAnswers)
      const score = blendScore(islandScore, overlap)
      return {
        userId: u.id,
        nickname: u.nickname ?? '匿名岛民',
        age: u.birthYear ? 2026 - u.birthYear : 0,
        city: u.city ?? '',
        height: u.height,
        avatar: u.avatar,
        identity: { code: identity.code, name: identity.name, core: identity.core, tags: identity.tags.slice(0, 2) },
        overlapPercent: overlap.total > 0 ? overlap.percent : null, // 剧情重合度（一起玩过才有）
        score, // 融合后的契合指数
      }
    })
    .sort((a, b) => b.score - a.score)

  return NextResponse.json({ candidates, city: me.city })
}
