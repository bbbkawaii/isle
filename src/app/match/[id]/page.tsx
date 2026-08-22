import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getIdentity } from '@/lib/content/identities'
import { getOption } from '@/lib/content/scenes'
import { fogLabel } from '@/lib/fogContrast'
import MatchView, { type Side } from './MatchView'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      userA: { include: { session: { include: { report: true } } } },
      userB: { include: { session: { include: { report: true } } } },
      invitation: { include: { activity: true } },
    },
  })
  if (!match) notFound()

  const fog = JSON.parse(match.fogContrast) as {
    mine: number
    theirs: number
    verdict: string
    kind: string
    reasons: string[]
    mineUserId: string
  }

  const sideOf = (u: typeof match.userA | typeof match.userB) => {
    const identity = getIdentity(u.session!.report!.identity)!
    const fogOption = u.id === fog.mineUserId ? fog.mine : fog.theirs
    const opt = getOption(2, fogOption)
    return {
      userId: u.id,
      nickname: u.nickname ?? '匿名岛民',
      identity: { code: identity.code, name: identity.name },
      fogLabel: fogLabel(fogOption),
      fogQuote: opt?.quote ?? '',
    }
  }
  const sides: [Side, Side] = [sideOf(match.userA), sideOf(match.userB)]

  return (
    <MatchView
      matchId={match.id}
      score={match.score}
      narrative={match.narrative}
      sides={sides}
      verdict={fog.verdict}
      kind={fog.kind}
      reasons={fog.reasons}
      invitation={match.invitation ? { status: match.invitation.status, title: match.invitation.activity.title } : null}
    />
  )
}
