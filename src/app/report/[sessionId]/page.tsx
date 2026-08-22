import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getIdentity } from '@/lib/content/identities'
import { getScene } from '@/lib/content/scenes'
import ReportView from './ReportView'

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const report = await prisma.report.findUnique({
    where: { sessionId },
    include: { session: { include: { answers: true } } },
  })
  if (!report) notFound()

  const identity = getIdentity(report.identity)!
  const answers = report.session.answers
    .slice()
    .sort((a, b) => a.sceneNo - b.sceneNo)
  const slowest = answers.reduce((m, a) => (a.decisionMs > m.decisionMs ? a : m), answers[0])
  const slowestScene = getScene(slowest.sceneNo)

  return (
    <ReportView
      identity={{
        code: identity.code,
        name: identity.name,
        icon: identity.icon,
        core: identity.core,
        tags: identity.tags,
        routine: identity.routine,
      }}
      loveProfile={report.loveProfile}
      preview={report.preview}
      slowest={{ title: slowestScene?.title ?? '', seconds: Math.round(slowest.decisionMs / 1000) }}
    />
  )
}
