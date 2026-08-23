import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getIdentity } from '@/lib/content/identities'
import { isProfileComplete } from '@/lib/stage'

// GET /api/me?userId= —— 我的：登岛证 + 身份报告 + 匹配/邀约记录
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ registered: false })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    relationLoadStrategy: 'join',
    include: {
      session: { include: { report: true } },
      matchesA: {
        include: {
          userB: { include: { session: { include: { report: true } } } },
          invitation: { include: { activity: true } },
        },
      },
      matchesB: {
        include: {
          userA: { include: { session: { include: { report: true } } } },
          invitation: { include: { activity: true } },
        },
      },
      likesSent: {
        orderBy: { createdAt: 'desc' },
        include: { toUser: { include: { session: { include: { report: true } } } } },
      },
    },
  })
  if (!user) return NextResponse.json({ registered: false })

  const matches = [
    ...user.matchesA.map(({ userB, ...match }) => ({ ...match, other: userB })),
    ...user.matchesB.map(({ userA, ...match }) => ({ ...match, other: userA })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // 我发出的心动（对方还没心动 → 未配对）：等待态的落地展示
  const matchedOtherIds = new Set(matches.map((m) => m.other.id))
  const pendingLikes = user.likesSent
    .filter((l) => !matchedOtherIds.has(l.toUserId))
    .filter((l) => l.toUser.session?.report)
    .map((l) => ({
      toUserId: l.toUserId,
      nickname: l.toUser.nickname ?? '匿名岛民',
      avatar: l.toUser.avatar,
      identity: getIdentity(l.toUser.session!.report!.identity)!.name,
    }))

  const report = user.session?.report
  return NextResponse.json({
    registered: true,
    profileComplete: isProfileComplete(user),
    user: {
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      age: user.birthYear ? 2026 - user.birthYear : 0,
      city: user.city,
      education: user.education,
      height: user.height,
      sessionId: user.sessionId,
      prefs: { ageMin: user.ageMin, ageMax: user.ageMax, cityScope: user.cityScope, eduReq: user.eduReq },
    },
    report: report
      ? {
          sessionId: report.sessionId,
          identity: getIdentity(report.identity)!.name,
          identityCode: report.identity,
          tags: JSON.parse(report.tags) as string[],
        }
      : null,
    matches: matches.map((m) => {
      const other = m.other
      const otherIdentity = getIdentity(other.session!.report!.identity)!
      return {
        matchId: m.id,
        score: m.score,
        otherNickname: other.nickname ?? '匿名岛民',
        otherIdentity: otherIdentity.name,
        otherAvatar: other.avatar,
        invitationStatus: m.invitation?.status ?? null,
        activityTitle: m.invitation?.activity.title ?? null,
      }
    }),
    pendingLikes,
  })
}
