// 剧情游戏（vane）重合度：跨游戏聚合 + 与五幕契合指数融合
// 供候选池排序与配对分数使用——「五幕看你们是什么人，剧情看你们处不处得来」

import { GAMES, matchPointsOf } from './content/vane-games'

export interface VaneAnswerLite {
  gameKey: string
  nodeId: string
  optionId: string
}

// 两人在所有共同玩过的剧情游戏上的选择重合度
export function overlapOf(mine: VaneAnswerLite[], theirs: VaneAnswerLite[]): { same: number; total: number; percent: number } {
  const m = new Map(mine.map((a) => [`${a.gameKey}|${a.nodeId}`, a.optionId]))
  const t = new Map(theirs.map((a) => [`${a.gameKey}|${a.nodeId}`, a.optionId]))
  const myGames = new Set(mine.map((a) => a.gameKey))
  const theirGames = new Set(theirs.map((a) => a.gameKey))
  let same = 0
  let total = 0
  for (const g of GAMES) {
    if (!myGames.has(g.id) || !theirGames.has(g.id)) continue // 只算两人都玩过的游戏
    for (const nid of matchPointsOf(g)) {
      const a = m.get(`${g.id}|${nid}`)
      const b = t.get(`${g.id}|${nid}`)
      if (a && b) {
        total++
        if (a === b) same++
      }
    }
  }
  return { same, total, percent: total ? Math.round((100 * same) / total) : 0 }
}

// 融合分数：没一起玩过剧情 → 纯五幕契合；玩过 → 五幕 60% + 重合度 40%
export function blendScore(islandScore: number, overlap: { total: number; percent: number }): number {
  if (overlap.total === 0) return islandScore
  return Math.round(islandScore * 0.6 + overlap.percent * 0.4)
}
