// 五幕内容加载层：数据在 src/data/game.json，本文件只做类型化与查询
import game from '@/data/game.json'

export interface DialogueLine {
  speaker: string
  text: string
}

export interface SceneOption {
  id: number
  label: string // 选项短标签
  icon: string // lucide 图标名
  text: string // 选项描述
  quote: string // 选中独白（GalGame/报告用）
  dim: Record<string, number> // 维度加分
}

export interface Scene {
  no: number
  code: string
  title: string
  subtitle: string
  scene: string // 场景描述（摘要用）
  bg: string // 背景图路径
  gradient: [string, string]
  lines: DialogueLine[] // GalGame 对话
  prompt: string
  options: SceneOption[]
}

export const SCENES: Scene[] = game.scenes as unknown as Scene[]
export const FOG_SCENE_NO = game.meta.fogSceneNo

export function getScene(no: number): Scene | undefined {
  return SCENES.find((s) => s.no === no)
}

export function getOption(no: number, optionId: number): SceneOption | undefined {
  return getScene(no)?.options.find((o) => o.id === optionId)
}
