// 为 21 个种子岛民（NPC）批量生成 AI 卡通头像并更新数据库
// 与用户照片转绘同一套风格 prompt，保证全局风格统一
// 用法：npx tsx scripts/gen-seed-avatars.ts [起始下标] [数量]

import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()
const KEY = process.env.AVATAR_API_KEY || ''
const BASE = (process.env.AVATAR_BASE_URL || '').replace(/\/+$/, '')

const TRAITS: Record<string, string> = {
  lighthouse: '清醒安静的气质，眼神温和，像深夜亮着灯的守望者',
  bonfire: '笑容热烈开朗，元气满满，人群的中心',
  valley: '温柔细腻，带着淡淡的诗意，适合慢慢靠近',
  cave: '戴圆框眼镜，安静内敛的读书人气质',
  orchard: '温暖朴实的笑容，可靠的行动派',
  cliff: '利落随性，冒险者的洒脱劲儿',
  market: '亲切靠谱，好邻居一样让人安心',
}
const HAIRS_F = ['黑色长直发', '棕色齐肩发', '深色丸子头', '微卷长发', '干净短发']
const HAIRS_M = ['黑色短发', '棕色短发', '利落寸头', '微卷短发', '黑色短发配简单耳骨钉']

async function genOne(prompt: string): Promise<Buffer> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/images/generations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'Qwen/Qwen-Image', prompt, image_size: '1024x1024' }),
        signal: AbortSignal.timeout(120_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const url = data?.images?.[0]?.url
      if (!url) throw new Error('no url')
      const img = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!img.ok) throw new Error('download failed')
      return Buffer.from(await img.arrayBuffer())
    } catch (e) {
      console.log(`  重试 ${attempt}: ${e instanceof Error ? e.message : e}`)
      if (attempt === 3) throw e
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
  throw new Error('unreachable')
}

async function main() {
  const start = Number(process.argv[2] ?? 0)
  const count = Number(process.argv[3] ?? 999)

  const users = await prisma.user.findMany({
    where: { session: { deviceToken: { startsWith: 'seed-' } } },
    include: { session: { include: { report: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const batch = users.slice(start, start + count)
  const dir = path.join(process.cwd(), 'public', 'avatars')
  await mkdir(dir, { recursive: true })

  let idx = start
  for (const u of batch) {
    const identityCode = u.session!.report!.identity
    const seedIdx = Number(u.session!.deviceToken.split('-')[2]) // 0..2
    const genderWord = u.gender === 'female' ? '二十多岁的女性' : '二十多岁的男性'
    const hair = (u.gender === 'female' ? HAIRS_F : HAIRS_M)[(seedIdx + idx) % 5]
    const prompt = `卡通头像插画：Q版大头特写，扁平矢量插画风，线条圆润干净，低饱和暖色调（珊瑚橙与青绿色点缀），纯浅灰背景。构图要求：人物面部严格居中，头部（含发型）占画面高度约七成半，肩部只露出一点，不画身体和场景，留白极少的居中特写。${genderWord}，${hair}，${TRAITS[identityCode] ?? '亲切友善'}。无文字无水印。`

    const t0 = Date.now()
    const buf = await genOne(prompt)
    const name = `seed-${identityCode}-${seedIdx}.png`
    await writeFile(path.join(dir, name), buf)
    await prisma.user.update({ where: { id: u.id }, data: { avatar: `/avatars/${name}` } })
    console.log(`[${idx + 1}/${users.length}] ${u.nickname} (${identityCode}) ← ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s, ${Math.round(buf.length / 1024)}KB)`)
    idx++
  }
  console.log('批量生成完成')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
