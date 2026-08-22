// 立绘抠图：从四角泛洪填充，把接近纯色的背景转为透明
// 用法：npx tsx scripts/cutout.ts <输入> <输出> [容差0-255，默认60]
import sharp from 'sharp'

const [input, output, tolArg] = process.argv.slice(2)
if (!input || !output) {
  console.error('usage: tsx scripts/cutout.ts <in> <out> [tol]')
  process.exit(1)
}
const TOL = Number(tolArg ?? 60)

async function main() {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels } = info
  const visited = new Uint8Array(w * h)
  const stack: number[] = []
  // 四角入栈
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    stack.push(y * w + x)
  }
  // 以四角平均色为背景基准
  const cornerIdx = [0, w - 1, (h - 1) * w, h * w - 1]
  let br = 0, bg = 0, bb = 0
  for (const i of cornerIdx) {
    br += data[i * channels]; bg += data[i * channels + 1]; bb += data[i * channels + 2]
  }
  br /= 4; bg /= 4; bb /= 4

  let removed = 0
  while (stack.length) {
    const p = stack.pop()!
    if (p < 0 || p >= w * h || visited[p]) continue
    const o = p * channels
    const dr = Math.abs(data[o] - br), dg = Math.abs(data[o + 1] - bg), db = Math.abs(data[o + 2] - bb)
    if (dr > TOL || dg > TOL || db > TOL) continue // 不是背景，停止扩散
    visited[p] = 1
    removed++
    const x = p % w, y = (p / w) | 0
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (y > 0) stack.push(p - w)
    if (y < h - 1) stack.push(p + w)
  }
  // 背景像素 alpha=0，并轻度收缩边缘 1px 去白边
  const out = Buffer.from(data)
  for (let p = 0; p < w * h; p++) {
    if (visited[p]) out[p * channels + 3] = 0
  }
  // 边缘收缩：与透明像素相邻的前景像素 alpha 减半（羽化）
  const feather = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      if (visited[p]) continue
      const n = (x > 0 && visited[p - 1]) || (x < w - 1 && visited[p + 1]) || (y > 0 && visited[p - w]) || (y < h - 1 && visited[p + w])
      if (n) feather[p] = 1
    }
  }
  for (let p = 0; p < w * h; p++) if (feather[p]) out[p * channels + 3] = 110

  await sharp(out, { raw: { width: w, height: h, channels } }).png().toFile(output)
  console.log(`抠图完成：${removed}/${w * h} 像素透明 (${((removed / (w * h)) * 100).toFixed(1)}%) -> ${output}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
