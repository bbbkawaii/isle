import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveStage } from '@/lib/stage'

// GET /api/status?userId=&sessionId=
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const sessionId = searchParams.get('sessionId')

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        relationLoadStrategy: 'join',
        include: { session: { include: { report: true } } },
      })
    : null
  let sessionReportIdentity = user?.session?.id === sessionId ? user.session.report?.identity ?? null : null
  if (sessionId && user?.session?.id !== sessionId) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      relationLoadStrategy: 'join',
      include: { report: true },
    })
    sessionReportIdentity = session?.report?.identity ?? null
  }
  return NextResponse.json(resolveStage({ user, sessionReportIdentity }))
}
