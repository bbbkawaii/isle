import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

// POST /api/auth/login { email, password }
// 邮箱+密码登录（无验证码）：返回账号身份，客户端恢复本地登录态
export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: '邮箱和密码都要填' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } })
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: '账号或密码不对' }, { status: 401 })
  }
  const ok = await bcrypt.compare(String(password), user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: '账号或密码不对' }, { status: 401 })
  }
  return NextResponse.json({
    userId: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    sessionId: user.sessionId,
    gender: user.gender,
  })
}
