import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getIdentity } from '@/lib/content/identities'
import { getScene, getOption } from '@/lib/content/scenes'

// GET /api/feed?userId= —— 首页推荐流：回答卡 ×4 + 关系卡 + 活动卡
// 「先内容后身份」：从别人的回答痕迹开始认识人
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  // 回答卡：种子岛民，身份去重，优先展示迷雾/心动两幕
  const seeds = await prisma.user.findMany({
    where: { session: { deviceToken: { startsWith: 'seed-' } } },
    include: { session: { include: { answers: true, report: true } } },
    take: 24,
  })
  const seenIdentity = new Set<string>()
  const picked: typeof seeds = []
  for (const u of seeds) {
    if (seenIdentity.has(u.session!.report!.identity)) continue
    seenIdentity.add(u.session!.report!.identity)
    picked.push(u)
  }
  const answerCards = picked.slice(0, 4).map((u, i) => {
    const identity = getIdentity(u.session!.report!.identity)!
    const sceneNo = i % 2 === 0 ? 2 : 3 // 迷雾 / 心动 交替
    const answer = u.session!.answers.find((a) => a.sceneNo === sceneNo) ?? u.session!.answers[1]
    const scene = getScene(answer.sceneNo)!
    const opt = getOption(answer.sceneNo, answer.optionId)!
    return {
      type: 'answer' as const,
      userId: u.id,
      nickname: u.nickname ?? '匿名岛民',
      avatar: u.avatar,
      city: u.city ?? '',
      age: u.birthYear ? 2026 - u.birthYear : 0,
      identity: { code: identity.code, name: identity.name },
      scene: { no: scene.no, title: scene.title, subtitle: scene.subtitle, prompt: scene.prompt },
      choice: { label: opt.label, quote: opt.quote },
    }
  })

  // 关系卡：最近一段配对的完整信息（对方形象/身份/进度）
  let relationCard = null
  if (userId) {
    const m = await prisma.match.findFirst({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        invitation: { include: { activity: true } },
        userA: { include: { session: { include: { report: true } } } },
        userB: { include: { session: { include: { report: true } } } },
      },
    })
    if (m) {
      const other = m.userAId === userId ? m.userB : m.userA
      const otherIdentity = getIdentity(other.session!.report!.identity)!
      relationCard = {
        type: 'relation' as const,
        matchId: m.id,
        score: m.score,
        status: m.invitation?.status ?? 'matched',
        activityTitle: m.invitation?.activity.title ?? null,
        other: {
          nickname: other.nickname ?? '匿名岛民',
          avatar: other.avatar,
          identity: { code: otherIdentity.code, name: otherIdentity.name },
        },
      }
    }
  }

  // 活动卡
  const activity = await prisma.activity.findFirst()
  const activityCard = activity
    ? { type: 'activity' as const, id: activity.id, title: activity.title, timeDesc: activity.timeDesc, place: activity.place, icebreak: activity.icebreak }
    : null

  return NextResponse.json({
    answerCards,
    relationCard,
    activityCard,
  })
}
