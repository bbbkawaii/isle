import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/register —— 登岛后填写资料：更新已登录账号并认领游戏局
export async function POST(req: Request) {
  const body = await req.json()
  const {
    userId, deviceToken, gender, birthYear, city, education, height, intent,
    ageMin, ageMax, cityScope, eduReq, avatar, nickname,
  } = body

  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }
  if (!nickname?.trim()) {
    return NextResponse.json({ error: '先给自己起个昵称' }, { status: 400 })
  }
  if (!gender || !birthYear || !city || !education) {
    return NextResponse.json({ error: '性别、出生年份、城市、学历都要填' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: String(userId) } })
  if (!user) return NextResponse.json({ error: '账号不存在，请重新登录' }, { status: 404 })

  let sessionId = user.sessionId
  if (!sessionId && deviceToken) {
    const session = await prisma.gameSession.findFirst({
      where: { deviceToken, finishedAt: { not: null }, claimedBy: null },
      orderBy: { finishedAt: 'desc' },
    })
    if (session) sessionId = session.id
  }
  if (!sessionId) {
    return NextResponse.json({ error: '没有可登记的游戏局，请先完成登岛问答' }, { status: 400 })
  }

  const year = Number(birthYear)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      sessionId,
      avatar: typeof avatar === 'string' ? avatar : user.avatar,
      nickname: String(nickname).trim().slice(0, 12),
      gender,
      birthYear: year,
      city,
      education,
      height: height ? Number(height) : null,
      intent: intent || null,
      ageMin: Number(ageMin ?? year - 5),
      ageMax: Number(ageMax ?? year + 7),
      cityScope: cityScope || 'same_city',
      eduReq: eduReq || 'none',
    },
  })

  return NextResponse.json({ userId: updated.id })
}
