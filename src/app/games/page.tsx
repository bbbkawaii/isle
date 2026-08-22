'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Coffee, Scale, Crown, Gamepad2, Play, Sparkles, type LucideIcon } from 'lucide-react'
import { gameListMeta } from '@/lib/content/vane-games'
import TabBar from '@/components/TabBar'

const ICONS: Record<string, LucideIcon> = { Heart, Coffee, Scale, Crown, Gamepad2 }

export default function GamesPage() {
  const games = gameListMeta()

  return (
    <main className="shell bg-paper px-5 pb-28 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-2xl leading-7 text-ink">游戏广场</h1>
        <p className="mt-1 text-[11px] leading-5 text-ink-soft">
          和心动的人玩同一套剧情，选择重合度越高越默契
        </p>
      </header>

      <div className="space-y-4">
        {games.map((g, i) => {
          const Icon = ICONS[g.icon] ?? Gamepad2
          return (
            <motion.section
              key={g.id}
              className="overflow-hidden rounded-card bg-card shadow-sm"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="flex cursor-pointer items-stretch">
                <Link href={`/games/${g.id}/play`} className="flex flex-1 items-center gap-4 py-4 pl-4" aria-label={`进入${g.name}`}>
                  {g.cover ? (
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cover bg-center text-white shadow-inner"
                      style={{ backgroundImage: `url(${g.cover})` }}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 backdrop-blur-[2px]">
                        <Icon size={18} />
                      </span>
                    </span>
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#14263a] to-[#1d4a5f] text-white">
                      <Icon size={26} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base text-ink">{g.name}</h3>
                      {g.dualRole && (
                        <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] text-coral-deep">双角色</span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-soft">{g.description}</p>
                    <p className="mt-1.5 text-[10px] text-ink-soft/70">
                      {g.questions} 个选择 · 约 {g.charsKb} 千字
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/games/${g.id}/play`}
                  className="flex w-20 cursor-pointer flex-col items-center justify-center border-l border-[#f0ede5] text-coral-deep"
                  aria-label={`开始${g.name}`}
                >
                  <Play size={20} fill="currentColor" />
                  <span className="mt-1 text-[11px] font-medium">开始</span>
                </Link>
              </div>
            </motion.section>
          )
        })}
      </div>

      <div className="mt-6 rounded-card border border-dashed border-[#d8d2c6] p-4 text-[11px] leading-6 text-ink-soft">
        <p className="flex items-center gap-1.5 text-xs font-medium text-teal">
          <Sparkles size={13} /> 玩法说明
        </p>
        <p className="mt-1.5">
          剧情类似视觉小说：点击推进对话，在关键节点做选择，走向不同结局。
          男女视角体验同一套剧情（选项一致），玩完按「选择重合度」为你匹配异性玩家——
          重合度越高，说明你们在剧情里的默契越强。
        </p>
      </div>

      <p className="mt-5 text-center text-[11px] text-ink-soft/70">登岛五幕在首页，是解锁配对的主线</p>
      <TabBar />
    </main>
  )
}
