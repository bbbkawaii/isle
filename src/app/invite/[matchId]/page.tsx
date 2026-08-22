import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getIdentity } from '@/lib/content/identities'
import InviteView from './InviteView'

export default async function InvitePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: { include: { session: { include: { report: true } } } },
      userB: { include: { session: { include: { report: true } } } },
      invitation: { include: { activity: true } },
    },
  })
  if (!match) notFound()

  const activities = await prisma.activity.findMany()
  const fog = JSON.parse(match.fogContrast) as { verdict: string }

  const sides = [match.userA, match.userB].map((u) => {
    const identity = getIdentity(u.session!.report!.identity)!
    return {
      userId: u.id,
      nickname: u.nickname ?? '匿名岛民',
      identity: { code: identity.code, name: identity.name },
    }
  })

  return (
    <InviteView
      matchId={match.id}
      fogVerdict={fog.verdict}
      sides={[sides[0], sides[1]]}
      activities={activities.map((a) => ({
        id: a.id,
        title: a.title,
        timeDesc: a.timeDesc,
        place: a.place,
        icebreak: a.icebreak,
        fitTags: JSON.parse(a.fitTags) as string[],
      }))}
      invitation={
        match.invitation
          ? {
              id: match.invitation.id,
              status: match.invitation.status,
              inviteText: match.invitation.inviteText,
              counterReason: match.invitation.counterReason,
              round: match.invitation.round,
              initiatorId: match.invitation.initiatorId,
              activity: {
                id: match.invitation.activity.id,
                title: match.invitation.activity.title,
                timeDesc: match.invitation.activity.timeDesc,
                place: match.invitation.activity.place,
                icebreak: match.invitation.activity.icebreak,
                fitTags: JSON.parse(match.invitation.activity.fitTags) as string[],
              },
            }
          : null
      }
    />
  )
}
