import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/user/prefs { userId, ageMin, ageMax, cityScope, eduReq }
// 登岛后调整匹配偏好（候选池空状态的「放宽偏好」落地处）
export async function POST(req: Request) {
  const { userId, ageMin, ageMax, cityScope, eduReq } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const min = Number(ageMin)
  const max = Number(ageMax)
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max || min < 1950 || max > 2015) {
    return NextResponse.json({ error: '年龄范围不对' }, { status: 400 })
  }
  if (!['same_city', 'any'].includes(cityScope)) {
    return NextResponse.json({ error: '城市要求不合法' }, { status: 400 })
  }
  if (!['none', 'bachelor', 'master'].includes(eduReq)) {
    return NextResponse.json({ error: '学历要求不合法' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: userId },
    data: { ageMin: min, ageMax: max, cityScope, eduReq },
  })
  return NextResponse.json({ ok: true })
}
