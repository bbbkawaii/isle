import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/user/avatar { userId, avatar?, nickname? }
// 已登记用户更新形象 / 昵称
export async function POST(req: Request) {
  const { userId, avatar, nickname } = await req.json()
  if (!userId || (avatar == null && nickname == null)) {
    return NextResponse.json({ error: 'userId and avatar or nickname required' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const data: { avatar?: string; nickname?: string } = {}
  if (typeof avatar === 'string' && avatar) data.avatar = avatar
  if (typeof nickname === 'string') data.nickname = nickname.trim().slice(0, 12)
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: userId }, data })
  return NextResponse.json({ ok: true })
}
