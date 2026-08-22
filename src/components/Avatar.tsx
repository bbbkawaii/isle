'use client'

// Q 版捏脸：发型×发色×肤色×服装×配饰，SVG 组合渲染
// 匿名阶段的「角色投影」——先认识一个人的回答，再认识本人

export interface AvatarConfig {
  hair: 0 | 1 | 2 | 3 // 短发 / 长发 / 双马尾 / 丸子头
  hairColor: string
  skin: string
  outfit: string
  acc: 0 | 1 | 2 | 3 // 无 / 星星发饰 / 花环 / 眼镜
}

export const HAIR_COLORS = ['#3a3348', '#7a4a2b', '#c98a3d', '#2e7d8c', '#d4738c', '#7b5fc0']
export const SKINS = ['#ffe3d0', '#f5c9a8', '#d9a47e']
export const OUTFITS = ['#ff6b5e', '#0fb5a6', '#4a6fa5', '#ffb84d', '#8a67ab']
export const HAIR_NAMES = ['清爽短发', '温柔长发', '元气双马尾', '松松丸子头']
export const ACC_NAMES = ['无', '星星发饰', '小花环', '圆眼镜']

export function randomAvatar(seedStr: string): AvatarConfig {
  let h = 0
  for (const c of seedStr) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return {
    hair: (h % 4) as AvatarConfig['hair'],
    hairColor: HAIR_COLORS[h % HAIR_COLORS.length],
    skin: SKINS[(h >> 3) % SKINS.length],
    outfit: OUTFITS[(h >> 5) % OUTFITS.length],
    acc: ((h >> 7) % 4) as AvatarConfig['acc'],
  }
}

export function parseAvatar(json: string | null | undefined): AvatarConfig | null {
  if (!json) return null
  try {
    const c = JSON.parse(json) as AvatarConfig
    if (typeof c.hair === 'number' && c.hairColor && c.skin && c.outfit) return c
  } catch {
    /* ignore */
  }
  return null
}

// 判断存的是不是图片（AI 转绘结果存 URL，捏脸存 JSON）
export function isAvatarImage(avatar: string | null | undefined): boolean {
  if (!avatar) return false
  return avatar.startsWith('/') || avatar.startsWith('http') || avatar.startsWith('data:')
}

// 统一形象渲染：图片（AI 转绘）或 SVG（捏脸）自动识别
export function UserAvatar({
  avatar,
  seed,
  size = 48,
  ring,
}: {
  avatar: string | null | undefined
  seed: string
  size?: number
  ring?: boolean
}) {
  if (isAvatarImage(avatar)) {
    // AI 生成图人脸不一定居中：容器裁圆 + 图片放大上移，聚焦头部
    return (
      <span
        className={`inline-block shrink-0 overflow-hidden rounded-full bg-[#e8e2d4] ${ring ? 'ring-2 ring-white/60' : ''}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar as string}
          alt="岛上形象"
          className="h-full w-full object-cover"
          style={{ transform: 'scale(1.28)', transformOrigin: '50% 36%' }}
        />
      </span>
    )
  }
  const cfg = parseAvatar(avatar) ?? randomAvatar(seed)
  return <Avatar config={cfg} size={size} ring={ring} />
}

export default function Avatar({ config, size = 64, ring }: { config: AvatarConfig; size?: number; ring?: boolean }) {
  const { hair, hairColor, skin, outfit, acc } = config
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={ring ? 'rounded-full ring-2 ring-white/60' : 'rounded-full'}
      aria-hidden
    >
      <defs>
        <linearGradient id={`bg-${hair}-${outfit}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dff0ee" />
          <stop offset="100%" stopColor="#bcdcdc" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill={`url(#bg-${hair}-${outfit})`} />

      {/* 后发层 */}
      {hair === 1 && <path d="M52 96 C48 40 152 40 148 96 C150 130 146 158 138 170 L62 170 C54 158 50 130 52 96 Z" fill={hairColor} />}
      {hair === 2 && (
        <>
          <path d="M52 96 C48 40 152 40 148 96 C150 126 146 148 140 160 L60 160 C54 148 50 126 52 96 Z" fill={hairColor} />
          <ellipse cx="34" cy="128" rx="16" ry="34" fill={hairColor} />
          <ellipse cx="166" cy="128" rx="16" ry="34" fill={hairColor} />
          <circle cx="34" cy="96" r="12" fill={hairColor} />
          <circle cx="166" cy="96" r="12" fill={hairColor} />
        </>
      )}
      {hair === 3 && <path d="M56 92 C54 46 146 46 144 92 C146 116 144 134 138 144 L62 144 C56 134 54 116 56 92 Z" fill={hairColor} />}

      {/* 身体（小 shoulders） */}
      <path d="M64 200 C64 168 80 152 100 152 C120 152 136 168 136 200 Z" fill={outfit} />
      <path d="M92 152 L100 164 L108 152" fill="#ffffff" opacity="0.9" />

      {/* 脸 */}
      <ellipse cx="100" cy="98" rx="46" ry="44" fill={skin} />

      {/* 前发/刘海 */}
      {hair === 0 && <path d="M54 96 C52 52 148 52 146 96 C140 78 128 68 118 72 C112 60 88 60 82 72 C72 68 60 78 54 96 Z" fill={hairColor} />}
      {hair === 1 && <path d="M54 96 C52 50 148 50 146 96 C142 74 130 66 118 70 C114 58 86 58 82 70 C70 66 58 74 54 96 Z" fill={hairColor} />}
      {hair === 2 && <path d="M54 96 C52 50 148 50 146 96 C140 72 126 64 116 70 C112 56 88 56 84 70 C74 64 60 72 54 96 Z" fill={hairColor} />}
      {hair === 3 && (
        <>
          <path d="M56 92 C56 56 144 56 144 92 C138 74 124 68 114 72 C110 62 90 62 86 72 C76 68 62 74 56 92 Z" fill={hairColor} />
          <circle cx="100" cy="50" r="18" fill={hairColor} />
          <circle cx="93" cy="44" r="3.5" fill="#ffffff" opacity="0.85" />
        </>
      )}

      {/* 眼睛 */}
      <g>
        <circle cx="82" cy="102" r="6.5" fill="#2f2a33" />
        <circle cx="118" cy="102" r="6.5" fill="#2f2a33" />
        <circle cx="84" cy="100" r="2.2" fill="#fff" />
        <circle cx="120" cy="100" r="2.2" fill="#fff" />
      </g>
      {/* 腮红 */}
      <ellipse cx="72" cy="114" rx="7" ry="4.5" fill="#ff9d8f" opacity="0.55" />
      <ellipse cx="128" cy="114" rx="7" ry="4.5" fill="#ff9d8f" opacity="0.55" />
      {/* 微笑 */}
      <path d="M92 116 Q100 123 108 116" stroke="#b06a5a" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* 配饰 */}
      {acc === 1 && (
        <path d="M138 62 l2.6 5.6 6 0.8 -4.4 4.2 1.1 6 -5.3 -2.9 -5.3 2.9 1.1 -6 -4.4 -4.2 6 -0.8 Z" fill="#ffd166" stroke="#e8a93c" strokeWidth="1" />
      )}
      {acc === 2 && (
        <>
          <circle cx="60" cy="70" r="5" fill="#ff9db8" />
          <circle cx="72" cy="62" r="4" fill="#fff3b0" />
          <circle cx="86" cy="58" r="5" fill="#ff9db8" />
        </>
      )}
      {acc === 3 && (
        <g stroke="#4a4458" strokeWidth="3" fill="none">
          <circle cx="82" cy="102" r="12" />
          <circle cx="118" cy="102" r="12" />
          <path d="M94 102 Q100 108 106 102" />
        </g>
      )}
    </svg>
  )
}
