import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/user/avatar { userId, avatar }
// 已登记用户更新形象（AI 转绘 URL 或捏脸 JSON 均可存）
export async function POST(req: Request) {
  const { userId, avatar } = await req.json()
  if (!userId || !avatar) {
    return NextResponse.json({ error: 'userId/avatar required' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  await prisma.user.update({ where: { id: userId }, data: { avatar } })
  return NextResponse.json({ ok: true })
}
