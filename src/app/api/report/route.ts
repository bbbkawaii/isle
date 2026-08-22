import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildReportData } from '@/lib/scoring'
import { getOption } from '@/lib/content/scenes'
import { getIdentity } from '@/lib/content/identities'
import { genLoveProfile } from '@/lib/llm'

// POST /api/report { sessionId } —— 终幕结算：判定身份 + 生成画像（LLM 或兜底）
export async function POST(req: Request) {
  const { sessionId, userId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { answers: true },
  })
  if (!session) return NextResponse.json({ error: 'session not found' }, { status: 404 })
  if (session.answers.length < 5) {
    return NextResponse.json({ error: 'answers incomplete' }, { status: 400 })
  }

  const answers = session.answers
    .map((a) => ({ sceneNo: a.sceneNo, optionId: a.optionId }))
    .sort((a, b) => a.sceneNo - b.sceneNo)
  const report = buildReportData(answers)
  const identity = getIdentity(report.identityCode)!

  const digest = answers
    .map((a) => {
      const opt = getOption(a.sceneNo, a.optionId)
      return `第${a.sceneNo}幕选「${opt?.label ?? a.optionId}」`
    })
    .join('；')

  const loveProfile = await genLoveProfile({
    identityName: identity.name,
    core: identity.core,
    tags: identity.tags,
    digest,
    fallback: identity.fallbackProfile,
  })

  await prisma.report.upsert({
    where: { sessionId },
    create: {
      sessionId,
      identity: identity.code,
      vector: JSON.stringify(report.dims),
      loveProfile,
      tags: JSON.stringify(identity.tags),
      preview: identity.preview,
    },
    update: { identity: identity.code, vector: JSON.stringify(report.dims), loveProfile },
  })
  await prisma.gameSession.update({ where: { id: sessionId }, data: { finishedAt: new Date() } })

  // 登录用户重玩：把账号绑定到最新一局，报告/身份随之更新
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId } })
    if (u) {
      await prisma.user.update({ where: { id: userId }, data: { sessionId } })
      await prisma.gameSession.updateMany({ where: { claimedBy: { id: userId }, id: { not: sessionId } }, data: { /* 旧局保留，仅解除认领由下句实现 */ } })
      // 解除旧局认领（先查后更，避免唯一约束冲突）
      const old = await prisma.gameSession.findFirst({ where: { claimedBy: { id: userId }, id: { not: sessionId } } })
      if (old) await prisma.gameSession.update({ where: { id: old.id }, data: { claimedBy: { disconnect: true } } })
    }
  }

  return NextResponse.json({ identity: identity.code })
}
