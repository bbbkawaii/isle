'use client'

import { motion } from 'framer-motion'

// 七大岛区的地图坐标（viewBox 0 0 240 150 内）
export const IDENTITY_POS: Record<string, { x: number; y: number; label: string }> = {
  lighthouse: { x: 52, y: 22, label: '灯塔' },
  cliff: { x: 80, y: 32, label: '悬崖' },
  cave: { x: 22, y: 48, label: '洞穴' },
  bonfire: { x: 52, y: 55, label: '篝火' },
  market: { x: 76, y: 66, label: '市集' },
  valley: { x: 30, y: 78, label: '溪谷' },
  orchard: { x: 60, y: 88, label: '果园' },
}

interface IslandMapProps {
  highlight?: string // 要点亮的身份 code
  dark?: boolean // 深色底版本
  revealDots?: boolean // 逐个点亮动画（游戏收尾用）
}

export default function IslandMap({ highlight, dark = false, revealDots = false }: IslandMapProps) {
  const land = dark ? '#1c2a3d' : '#e8e2d4'
  const edge = dark ? '#2c4258' : '#d8d0bd'
  const labelColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(23,26,33,0.4)'
  const entries = Object.entries(IDENTITY_POS)

  return (
    <svg viewBox="0 0 240 150" className="w-full" aria-hidden>
      {/* 海面 */}
      <ellipse cx="120" cy="86" rx="118" ry="60" fill={dark ? '#14263a' : '#eef0e9'} opacity="0.5" />
      {/* 岛体 */}
      <path
        d="M28 92 C22 62 48 34 86 26 C120 19 158 24 186 42 C214 60 216 88 196 108 C172 132 118 140 80 130 C46 121 33 112 28 92 Z"
        fill={land}
        stroke={edge}
        strokeWidth="1.5"
      />
      {entries.map(([code, pos], i) => {
        const isHi = highlight === code
        return (
          <motion.g
            key={code}
            initial={revealDots ? { opacity: 0, scale: 0.4 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: revealDots ? 0.35 + i * 0.18 : 0, type: 'spring', stiffness: 260, damping: 18 }}
            style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
          >
            {isHi && (
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="7"
                fill="#ffb84d"
                initial={{ opacity: 0.6 }}
                animate={{ opacity: [0.6, 0, 0.6], r: [7, 14, 7] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            )}
            <circle cx={pos.x} cy={pos.y} r={isHi ? 4 : 2.6} fill={isHi ? '#ffb84d' : dark ? '#5b7a99' : '#9aa3af'} />
            <text x={pos.x} y={pos.y + (code === 'orchard' ? 12 : -7)} textAnchor="middle" fontSize="7" fill={isHi ? (dark ? '#ffd699' : '#8a6116') : labelColor}>
              {pos.label}
            </text>
          </motion.g>
        )
      })}
    </svg>
  )
}
