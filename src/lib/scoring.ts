// 匹配引擎：规则数据在 src/data/game.json 的 matchRules，本文件是通用解释器
// 改规则/权重/文案只需改 JSON，不用动代码

import game from '@/data/game.json'
import { getOption } from './content/scenes'
import { classifyIdentity } from './content/identities'
import { fogContrastOf } from './fogContrast'

export type Answer = { sceneNo: number; optionId: number }

interface RuleMatch {
  type: 'combo' | 'pair' | 'either' | 'same'
  a?: number
  b?: number
  symmetric?: boolean
}
interface MatchRule {
  scene: number
  match: RuleMatch
  delta: number
  desc: string
}

const RULES = game.matchRules as unknown as MatchRule[]

// —— 单人：维度累计 ——
export function accumulateDims(answers: Answer[]): Record<string, number> {
  const dims: Record<string, number> = {}
  for (const a of answers) {
    const opt = getOption(a.sceneNo, a.optionId)
    if (!opt) continue
    for (const [k, v] of Object.entries(opt.dim)) {
      dims[k] = (dims[k] ?? 0) + v
    }
  }
  return dims
}

// —— 规则命中 ——
function ruleHit(rule: MatchRule, m: number | undefined, t: number | undefined): boolean {
  const { type, a, b, symmetric } = rule.match
  switch (type) {
    case 'combo':
      return (m === a && t === b) || (symmetric === true && m === b && t === a)
    case 'pair':
      return [m, t].sort().join(',') === [a, b].sort().join(',')
    case 'either':
      return m === a || t === a
    case 'same':
      return m === t
    default:
      return false
  }
}

// —— 双人：相遇指数 ——
export interface PairResult {
  score: number
  reasons: string[]
}

function optionOf(answers: Answer[], sceneNo: number): number | undefined {
  return answers.find((a) => a.sceneNo === sceneNo)?.optionId
}

export function pairScore(mine: Answer[], theirs: Answer[]): PairResult {
  let delta = 0
  const reasons: string[] = []
  for (const rule of RULES) {
    if (ruleHit(rule, optionOf(mine, rule.scene), optionOf(theirs, rule.scene))) {
      delta += rule.delta
      reasons.push(rule.desc)
    }
  }
  const score = Math.max(game.config.min, Math.min(game.config.max, game.config.baseScore + delta))
  return { score, reasons }
}

// —— 报告数据组装 ——
export interface ReportData {
  identityCode: string
  dims: Record<string, number>
  answers: Answer[]
}

export function buildReportData(answers: Answer[]): ReportData {
  return {
    identityCode: classifyIdentity(answers).code,
    dims: accumulateDims(answers),
    answers,
  }
}

// 迷雾夜对照
export function fogContrastForPair(mine: Answer[], theirs: Answer[]) {
  return fogContrastOf(optionOf(mine, game.meta.fogSceneNo) ?? 1, optionOf(theirs, game.meta.fogSceneNo) ?? 1)
}

export { SCENES } from './content/scenes'
