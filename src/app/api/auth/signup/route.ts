import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

// POST /api/auth/signup { email, password }
// 先建账号，登岛和填资料在后面
export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: '邮箱和密码都要填' }, { status: 400 })
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

  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      passwordHash: await bcrypt.hash(String(password), 10),
      ageMin: 1988,
      ageMax: 2006,
    },
  })

  return NextResponse.json({ userId: user.id })
}
