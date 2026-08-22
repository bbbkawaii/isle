import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getVaneGame, matchPointsOf } from '@/lib/content/vane-games'
import { getIdentity } from '@/lib/content/identities'

// POST /api/vane/submit { userId, gameKey, answers: [{nodeId, optionId}] }
// 提交剧情游戏选择 → 按重合度匹配异性用户（选项 id 男女一致，同 id 即同选择）
// 重合度 = 匹配点上选择一致数 ÷ 匹配点总数 × 100
export async function POST(req: Request) {
  const { userId, gameKey, answers } = await req.json()
  if (!userId || !gameKey || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'userId/gameKey/answers required' }, { status: 400 })
  }

  const game = getVaneGame(gameKey)
  if (!game) return NextResponse.json({ error: 'game not found' }, { status: 404 })

  const me = await prisma.user.findUnique({ where: { id: userId } })
  if (!me) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const matchPoints = matchPointsOf(game)
  const myMap = new Map<string, string>()
  for (const a of answers) {
    if (a.nodeId && a.optionId) myMap.set(String(a.nodeId), String(a.optionId))
  }

  // 幂等入库（同节点覆盖）
  for (const [nodeId, optionId] of myMap) {
    await prisma.vaneAnswer.upsert({
      where: { userId_gameKey_nodeId: { userId, gameKey, nodeId } },
      create: { userId, gameKey, nodeId, optionId },
      update: { optionId },
    })
  }

  // 对异性玩家的重合度计算（含种子岛民）
  const others = await prisma.vaneAnswer.findMany({
    where: { gameKey, userId: { not: userId } },
    include: {
      user: {
        include: { session: { include: { report: true } } },
      },
    },
  })
  const byUser = new Map<string, { nickname: string; avatar: string | null; age: number; city: string; identityName: string; answers: Map<string, string> }>()
  for (const a of others) {
    const u = a.user
    if (u.gender === me.gender) continue // 只匹配异性
    let row = byUser.get(u.id)
    if (!row) {
      const identity = u.session?.report ? getIdentity(u.session.report.identity) : undefined
      row = {
        nickname: u.nickname ?? '匿名岛民',
        avatar: u.avatar,
        age: 2026 - u.birthYear,
        city: u.city,
        identityName: identity?.name ?? '岛民',
        answers: new Map(),
      }
      byUser.set(u.id, row)
    }
    row.answers.set(a.nodeId, a.optionId)
  }

  const ranked = [...byUser.entries()]
    .map(([uid, row]) => {
      const same = matchPoints.filter((nid) => row.answers.get(nid) && row.answers.get(nid) === myMap.get(nid)).length
      return {
        userId: uid,
        nickname: row.nickname,
        avatar: row.avatar,
        age: row.age,
        city: row.city,
        identity: row.identityName,
        matchPercent: matchPoints.length ? Math.round((100 * same) / matchPoints.length) : 0,
      }
    })
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 20)

  return NextResponse.json({
    gameKey,
    gameName: game.name,
    matchPoints: matchPoints.length,
    matches: ranked,
    successCount: ranked.filter((m) => m.matchPercent >= 66).length,
  })
}
