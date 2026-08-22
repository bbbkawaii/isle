import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/session { deviceToken }
// 找回未完成的局（续玩），否则开新局
export async function POST(req: Request) {
  const { deviceToken } = await req.json()
  if (!deviceToken) {
    return NextResponse.json({ error: 'deviceToken required' }, { status: 400 })
  }

  const existing = await prisma.gameSession.findFirst({
    where: { deviceToken, finishedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { answers: true },
  })
  if (existing) {
    return NextResponse.json({
      sessionId: existing.id,
      answers: existing.answers.map((a) => ({ sceneNo: a.sceneNo, optionId: a.optionId })),
    })
  }

  const session = await prisma.gameSession.create({ data: { deviceToken } })
  return NextResponse.json({ sessionId: session.id, answers: [] })
}
