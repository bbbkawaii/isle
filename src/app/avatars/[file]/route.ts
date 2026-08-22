import { readFile } from 'fs/promises'
import path from 'path'

// GET /avatars/[file] —— 运行时生成的头像（AI 转绘）从磁盘直接读取
// 生产模式下 next start 不服务构建后新增的 public 文件，必须走本路由
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  // 防路径穿越：只允许简单文件名
  if (!/^[\w.-]+\.png$/.test(file)) {
    return new Response('bad request', { status: 400 })
  }
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'avatars', file))
    return new Response(new Uint8Array(buf), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return new Response('not found', { status: 404 })
  }
}
