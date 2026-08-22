// 七种岛民身份加载层：判定矩阵与文案在 src/data/game.json
import game from '@/data/game.json'

export interface Identity {
  code: string
  name: string
  icon: string // lucide 图标名（前端映射）
  core: string // 人格内核一句话
  tags: string[]
  matrix: Record<string, Record<string, number>> // sceneNo -> optionId -> 权重
  fallbackProfile: string // 无 LLM key 时的兜底恋爱画像
  preview: string // 「你会遇见谁」模糊预告钩子
  routine: string // 相遇叙事素材：这个岛民的日常动线
}

export const IDENTITIES: Identity[] = game.identities as unknown as Identity[]

export function getIdentity(code: string): Identity | undefined {
  return IDENTITIES.find((i) => i.code === code)
}

// 五幕答案 → 岛民身份。平票时按声明顺序（越靠前越具体），market 是平衡兜底
export function classifyIdentity(answers: { sceneNo: number; optionId: number }[]): Identity {
  let best: Identity = IDENTITIES[IDENTITIES.length - 1] // market 兜底
  let bestScore = -1
  for (const identity of IDENTITIES) {
    let score = 0
    for (const a of answers) {
      score += identity.matrix[String(a.sceneNo)]?.[String(a.optionId)] ?? 0
    }
    if (score > bestScore) {
      bestScore = score
      best = identity
    }
  }
  return best
}
