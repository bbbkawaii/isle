import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getIdentity } from '@/lib/content/identities'
import { genInviteText } from '@/lib/llm'

// POST /api/invite { matchId, activityId, initiatorId }
// 创建/重发邀约：AI 代写邀请语；「换一个」重选后走同一接口（round+1）
export async function POST(req: Request) {
  const { matchId, activityId, initiatorId } = await req.json()
  if (!matchId || !activityId || !initiatorId) {
    return NextResponse.json({ error: 'matchId/activityId/initiatorId required' }, { status: 400 })
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: { include: { session: { include: { report: true } } } },
      userB: { include: { session: { include: { report: true } } } },
    },
  })
  if (!match) return NextResponse.json({ error: 'match not found' }, { status: 404 })

  const activity = await prisma.activity.findUnique({ where: { id: Number(activityId) } })
  if (!activity) return NextResponse.json({ error: 'activity not found' }, { status: 404 })

  const initiator = initiatorId === match.userAId ? match.userA : match.userB
  const invitee = initiatorId === match.userAId ? match.userB : match.userA
  const initIdentity = getIdentity(initiator.session!.report!.identity)!
  const inviteeIdentity = getIdentity(invitee.session!.report!.identity)!
  const fog = JSON.parse(match.fogContrast) as { verdict: string }

  const inviteText = await genInviteText({
    activityTitle: activity.title,
    nameA: initIdentity.name,
    nameB: inviteeIdentity.name,
    fogVerdict: fog.verdict,
    fallback: `「${activity.title}」，${activity.timeDesc}，${activity.place}。听说那条路线很适合验证我们的迷雾夜判词——来吗？`,
  })

  const invitation = await prisma.invitation.upsert({
    where: { matchId },
    create: { matchId, initiatorId, activityId: activity.id, inviteText, status: 'sent' },
    update: {
      initiatorId,
      activityId: activity.id,
      inviteText,
      status: 'sent',
      counterReason: null,
      round: { increment: 1 },
    },
    include: { activity: true },
  })

  return NextResponse.json({ invitation })
}
