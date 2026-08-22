// 迷雾夜对照加载层：判词表在 src/data/game.json
import game from '@/data/game.json'

export interface FogContrast {
  mine: number
  theirs: number
  verdict: string // 一句判词
  kind: 'complement' | 'alike' | 'friction'
}

const TABLE = game.fogContrast.table as Record<string, { verdict: string; kind: FogContrast['kind'] }>
const LABELS = game.fogContrast.labels as Record<string, string>

export function fogContrastOf(mine: number, theirs: number): FogContrast {
  const hit = TABLE[`${mine},${theirs}`] ?? TABLE['1,1']
  return { mine, theirs, verdict: hit.verdict, kind: hit.kind }
}

export function fogLabel(optionId: number): string {
  return LABELS[String(optionId)] ?? LABELS['1']
}
