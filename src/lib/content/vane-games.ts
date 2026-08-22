// vane 剧情游戏加载层：DAG 剧情树（dialog/choice/ending）+ 男女双视角 + 匹配点
// 剧情 JSON 在 src/data/vane/，结构与 vane 项目 GAME_DESIGN.md 一致

import firstDate from '@/data/vane/first_date.json'
import lifestyle from '@/data/vane/lifestyle.json'
import values from '@/data/vane/values.json'
import fenghouNight from '@/data/vane/fenghou_night.json'

export type Gender = 'male' | 'female'
type GenderField = string | { male?: string; female?: string }

export interface VaneOption {
  id: string
  text: GenderField
  next: string
  match_point?: boolean
}
export interface VaneNode {
  type: 'dialog' | 'choice' | 'ending'
  speaker?: GenderField
  text?: GenderField
  next?: string
  options?: VaneOption[]
  ending_title?: GenderField
  role?: string // 双角色游戏：当前替谁作答
}
export interface VaneGame {
  id: string
  name: string
  description: string
  cover?: string
  dual_role?: boolean
  question_count?: number
  start_node: string
  nodes: Record<string, VaneNode>
}

export const GAMES: VaneGame[] = [
  firstDate as unknown as VaneGame,
  lifestyle as unknown as VaneGame,
  values as unknown as VaneGame,
  fenghouNight as unknown as VaneGame,
]

// 广场图标映射（emoji 封面转 lucide）
export const GAME_ICONS: Record<string, string> = {
  first_date: 'Heart',
  lifestyle: 'Coffee',
  values: 'Scale',
  fenghou_night_10min_dual_role_demo_v3: 'Crown',
}

// 剧情背景图（按幕切换）。封后夜 8 幕 × 7 图，均匀分布
export const GAME_BACKGROUNDS: Record<string, string[]> = {
  fenghou_night_10min_dual_role_demo_v3: [
    '/vane-bg/fenghou-1.jpg',
    '/vane-bg/fenghou-2.jpg',
    '/vane-bg/fenghou-3.jpg',
    '/vane-bg/fenghou-4.jpg',
    '/vane-bg/fenghou-5.jpg',
    '/vane-bg/fenghou-6.jpg',
    '/vane-bg/fenghou-7.jpg',
  ],
}

// 节点 → 第几幕（qN... 命名约定），失败按第 1 幕
export function actOfNode(nodeId: string): number {
  const m = /^q(\d+)/.exec(nodeId)
  return m ? Number(m[1]) : 1
}

// 幕 → 背景图（8 幕均匀映射到 N 张图）
export function bgForNode(gameId: string, nodeId: string): string | null {
  const bgs = GAME_BACKGROUNDS[gameId]
  if (!bgs || bgs.length === 0) return null
  const act = actOfNode(nodeId)
  const idx = Math.min(bgs.length - 1, Math.floor(((act - 1) * bgs.length) / 8))
  return bgs[idx]
}

export function getVaneGame(key: string): VaneGame | undefined {
  return GAMES.find((g) => g.id === key)
}

// 性别字段解析：字符串直接用，对象按性别取（缺省回退 male）
export function resolveField(v: GenderField | undefined, gender: Gender): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  return v[gender] ?? v.male ?? ''
}

// 匹配点：任一选项标了 match_point 的 choice 节点
export function matchPointsOf(game: VaneGame): string[] {
  return Object.entries(game.nodes)
    .filter(([, n]) => n.type === 'choice' && (n.options ?? []).some((o) => o.match_point))
    .map(([id]) => id)
}

// 广场元信息
export function gameListMeta() {
  return GAMES.map((g) => {
    const choices = Object.values(g.nodes).filter((n) => n.type === 'choice').length
    const chars = JSON.stringify(g.nodes).replace(/[^\u4e00-\u9fa5]/g, '').length
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      icon: GAME_ICONS[g.id] ?? 'Gamepad2',
      cover: GAME_BACKGROUNDS[g.id]?.[0] ?? null, // 封面图（有剧情背景的游戏）
      dualRole: !!g.dual_role,
      questions: g.question_count ?? choices,
      charsKb: Math.round(chars / 100) / 10, // 千字
    }
  })
}
