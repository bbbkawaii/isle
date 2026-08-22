// OpenAI 兼容 LLM 服务：live 调用 + 8s 超时自动回退预生成兜底
// 配置（.env.local）：LLM_BASE_URL（含 /v1 则写全）、LLM_API_KEY、LLM_MODEL
// 任一项为空 => 全部直接走兜底，演示永不因网络翻车。文风 persona 在 game.json。

import game from '@/data/game.json'

interface LLMConfig {
  baseURL: string
  apiKey: string
  model: string
}

function getConfig(): LLMConfig | null {
  const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = process.env
  if (!LLM_BASE_URL || !LLM_API_KEY || !LLM_MODEL) return null
  return { baseURL: LLM_BASE_URL.replace(/\/+$/, ''), apiKey: LLM_API_KEY, model: LLM_MODEL }
}

export function llmEnabled(): boolean {
  return getConfig() !== null
}

// 通用调用：失败/超时/未配置一律返回 fallback
async function llmText(system: string, user: string, fallback: string): Promise<string> {
  const cfg = getConfig()
  if (!cfg) return fallback
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`${cfg.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.9,
        max_tokens: 400,
        enable_thinking: false, // SiliconFlow Qwen3 系思考型模型需关闭，否则 content 为空
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return fallback
    const data = await res.json()
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim()
    return text && text.length > 10 ? text : fallback
  } catch {
    return fallback
  }
}

const WRITER = game.llm.persona

// —— 1. 个人报告 · 恋爱画像 ——
export async function genLoveProfile(input: {
  identityName: string
  core: string
  tags: string[]
  digest: string // 五幕选择的摘要
  fallback: string
}): Promise<string> {
  return llmText(
    WRITER,
    `这个人在游戏里的岛民身份是「${input.identityName}」（${input.core}），标签：${input.tags.join(' ')}。\nTA的五幕选择：${input.digest}\n请写一段 100 字左右的“恋爱画像”，第二人称“你”，讲清 TA 在关系里的样子、需要什么样的人。`,
    input.fallback,
  )
}

// —— 2. 匹配 · 相遇叙事 ——
export async function genMatchNarrative(input: {
  score: number
  nameA: string
  routineA: string
  nameB: string
  routineB: string
  fogVerdict: string
  reasons: string[]
  fallback: string
}): Promise<string> {
  return llmText(
    WRITER,
    `两个人在同一座岛上。${input.nameA}：${input.routineA}。${input.nameB}：${input.routineB}。\n迷雾夜的对照判词：${input.fogVerdict}\n加分与摩擦：${input.reasons.join('；')}\n相遇指数 ${input.score}。请写一段 120 字左右的“相遇叙事”，讲他们会在岛上哪里、以什么方式相遇，引用上面的判词意象。不要出现分数。`,
    input.fallback,
  )
}

// —— 3. 邀约 · 邀请语 ——
export async function genInviteText(input: {
  activityTitle: string
  nameA: string
  nameB: string
  fogVerdict: string
  fallback: string
}): Promise<string> {
  return llmText(
    WRITER,
    `${input.nameA} 想邀请 ${input.nameB} 一起参加：「${input.activityTitle}」。\n他们的迷雾夜判词：${input.fogVerdict}\n请替 ${input.nameA} 写一句 40 字以内的邀请语，轻松、具体、可答应，可以化用判词。`,
    input.fallback,
  )
}
