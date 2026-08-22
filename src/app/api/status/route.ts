import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/status?userId=&sessionId=
// 判断用户阶段：new（没玩过）/ played（玩完未登记）/ registered（已登岛）
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const sessionId = searchParams.get('sessionId')

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { session: { include: { report: true } } },
    })
    if (user) {
      return NextResponse.json({ stage: 'registered' })
    }
  }
  if (sessionId) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { report: true },
    })
    if (session?.report) {
      return NextResponse.json({ stage: 'played', identity: session.report.identity })
    }
  }
  return NextResponse.json({ stage: 'new' })
}
