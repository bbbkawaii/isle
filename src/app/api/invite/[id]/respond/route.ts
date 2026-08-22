import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/invite/[id]/respond { action: 'accept' | 'counter' | 'decline', reason? }
// 受邀方的三种选择：接受（成局）/ 换一个（附理由回传）/ 婉拒
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { action, reason } = await req.json()

  const invitation = await prisma.invitation.findUnique({ where: { id } })
  if (!invitation) return NextResponse.json({ error: 'invitation not found' }, { status: 404 })

  let status = invitation.status
  let counterReason = invitation.counterReason

  if (action === 'accept') {
    status = 'locked'
    counterReason = null
  } else if (action === 'counter') {
    status = 'counter'
    counterReason = reason ?? '想换个活动'
  } else if (action === 'decline') {
    status = 'declined'
  } else {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  }

  const updated = await prisma.invitation.update({
    where: { id },
    data: { status, counterReason },
    include: { activity: true },
  })
  return NextResponse.json({ invitation: updated })
}
