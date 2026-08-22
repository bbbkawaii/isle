import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/answer { sessionId, sceneNo, optionId, decisionMs }
// 幂等：同一幕重复提交覆盖（复合唯一键 sessionId_sceneNo）
export async function POST(req: Request) {
  const { sessionId, sceneNo, optionId, decisionMs } = await req.json()
  if (!sessionId || !sceneNo || !optionId) {
    return NextResponse.json({ error: 'sessionId/sceneNo/optionId required' }, { status: 400 })
  }

  await prisma.sceneAnswer.upsert({
    where: { sessionId_sceneNo: { sessionId, sceneNo } },
    create: { sessionId, sceneNo, optionId, decisionMs: decisionMs ?? 0 },
    update: { optionId, decisionMs: decisionMs ?? 0 },
  })
  return NextResponse.json({ ok: true })
}
