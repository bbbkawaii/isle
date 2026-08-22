import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

// POST /api/avatar/edit （multipart: photo）
// 照片 → Qwen/Qwen-Image-Edit-2509 统一卡通风格转绘 → 存 public/avatars → 返回 URL
// SiliconFlow 格式：POST {base}/images/generations，JSON 体 { model, image(dataURI), prompt, image_size }
// 配置（.env.local）：AVATAR_BASE_URL / AVATAR_API_KEY / AVATAR_MODEL
// 未配置 key 返回 model_not_configured，前端降级到手动捏脸

const STYLE_PROMPT =
  '把这张照片转绘成卡通头像插画：Q版大头特写，扁平矢量插画风，线条圆润干净，低饱和暖色调（珊瑚橙与青绿色点缀），纯浅灰背景。构图要求：人物面部严格居中，头部（含发型）占画面高度约七成半，肩部只露出一点，不画身体和场景，留白极少的居中特写。保留人物的发型、脸型、性别和神态特征，让人一眼认出是同一个人。无文字无水印。'

export const maxDuration = 120

export async function POST(req: Request) {
  const base = process.env.AVATAR_BASE_URL?.replace(/\/+$/, '')
  const key = process.env.AVATAR_API_KEY
  const model = process.env.AVATAR_MODEL || 'Qwen/Qwen-Image-Edit-2509'
  if (!base || !key) {
    return NextResponse.json({ error: 'model_not_configured' }, { status: 503 })
  }

  const form = await req.formData()
  const photo = form.get('photo')
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: 'photo required' }, { status: 400 })
  }

  try {
    const b64 = Buffer.from(await photo.arrayBuffer()).toString('base64')
    const res = await fetch(`${base}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: STYLE_PROMPT,
        image: `data:image/jpeg;base64,${b64}`,
        image_size: '1024x1024',
      }),
      signal: AbortSignal.timeout(110_000),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ error: 'model_error', detail: text.slice(0, 300) }, { status: 502 })
    }
    const data = await res.json()
    const url = data?.images?.[0]?.url ?? data?.data?.[0]?.url
    if (!url) return NextResponse.json({ error: 'empty_result' }, { status: 502 })

    const img = await fetch(url, { signal: AbortSignal.timeout(30_000) })
    if (!img.ok) return NextResponse.json({ error: 'download_failed' }, { status: 502 })
    const buf = Buffer.from(await img.arrayBuffer())

    const dir = path.join(process.cwd(), 'public', 'avatars')
    await mkdir(dir, { recursive: true })
    const name = `av_${Date.now()}_${randomBytes(4).toString('hex')}.png`
    await writeFile(path.join(dir, name), buf)

    return NextResponse.json({ url: `/avatars/${name}` })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'model_error', detail: msg.slice(0, 300) }, { status: 502 })
  }
}
