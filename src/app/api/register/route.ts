import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

// POST /api/register —— 登岛登记：认领最近一局已完成且未认领的游戏局
// 邮箱+密码注册（无验证码）；门槛偏好带默认值；先玩后登记的转化设计落在这里
export async function POST(req: Request) {
  const body = await req.json()
  const { deviceToken, gender, birthYear, city, education, height, intent, ageMin, ageMax, cityScope, eduReq, avatar, email, password, nickname } = body
  if (!deviceToken || !gender || !birthYear || !city || !education) {
    return NextResponse.json({ error: 'deviceToken/gender/birthYear/city/education required' }, { status: 400 })
  }
  if (!email || !password) {
    return NextResponse.json({ error: '邮箱和密码是账号凭证，都要填' }, { status: 400 })
  }
  const emailNorm = String(email).trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return NextResponse.json({ error: '邮箱格式不对' }, { status: 400 })
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 })
  }
  const dup = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (dup) {
    return NextResponse.json({ error: '这个邮箱已经注册过，去登录吧' }, { status: 409 })
  }

  const session = await prisma.gameSession.findFirst({
    where: { deviceToken, finishedAt: { not: null }, claimedBy: null },
    orderBy: { finishedAt: 'desc' },
  })
  if (!session) {
    return NextResponse.json({ error: '没有可登记的游戏局，请先完成五幕' }, { status: 400 })
  }

  const user = await prisma.user.create({
    data: {
      sessionId: session.id,
      avatar: typeof avatar === 'string' ? avatar : null,
      email: emailNorm,
      passwordHash: await bcrypt.hash(String(password), 10),
      nickname: typeof nickname === 'string' && nickname.trim() ? nickname.trim().slice(0, 12) : null,
      gender,
      birthYear: Number(birthYear),
      city,
      education,
      height: height ? Number(height) : null,
      intent: intent || null,
      ageMin: Number(ageMin ?? Number(birthYear) - 5),
      ageMax: Number(ageMax ?? Number(birthYear) + 7),
      cityScope: cityScope || 'same_city',
      eduReq: eduReq || 'none',
    },
  })

  return NextResponse.json({ userId: user.id })
}
