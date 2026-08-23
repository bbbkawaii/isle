'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Plus, Minus } from 'lucide-react'
import { getMyUserId } from '@/lib/client-device'
import IdentityIcon from '@/components/IdentityIcon'
import Typewriter from '@/components/Typewriter'

export interface Side {
  userId: string
  nickname: string
  identity: { code: string; name: string }
  fogLabel: string
  fogQuote: string
}

interface Props {
  matchId: string
  score: number
  narrative: string
  sides: [Side, Side]
  verdict: string
  kind: string
  reasons: string[]
  invitation: { status: string; title: string } | null
}

export default function MatchView({ matchId, score, narrative, sides, verdict, kind, reasons, invitation }: Props) {
  const [count, setCount] = useState(0)
  const myId = getMyUserId()
  const me = sides.find((s) => s.userId === myId) ?? sides[0]
  const ta = sides.find((s) => s.userId !== me.userId) ?? sides[1]

  // 契合指数滚动
  useEffect(() => {
    const start = performance.now()
    const dur = 1400
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setCount(Math.round(score * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  return (
    <main className="shell shell-night px-5 pb-10 pt-10">
      {/* 双向心动 */}
      <motion.div
        className="flex items-center justify-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <SideChip side={me} label="你" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-coral text-white shadow-[0_0_30px_rgba(255,107,94,0.6)]"
        >
          <Heart size={20} fill="currentColor" />
        </motion.div>
        <SideChip side={ta} label="TA" />
      </motion.div>
      <motion.p
        className="font-display mt-4 text-center text-sm text-white/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        两边都按下了心动 —— 配对成功
      </motion.p>

      {/* 契合指数 */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-xs tracking-[0.3em] text-white/45">契合指数</p>
        <p className="font-display mt-2 text-7xl leading-none text-white">
          {count}
          <span className="ml-1 align-top text-lg text-white/40">/100</span>
        </p>
      </motion.div>

      {/* 契合解读 */}
      <motion.section
        className="mt-8 rounded-card bg-white/5 p-5 ring-1 ring-white/10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <p className="mb-3 text-xs tracking-[0.25em] text-white/45">为什么是TA</p>
        <Typewriter text={narrative} className="min-h-[6rem] text-[15px] leading-8 text-white/90" />
      </motion.section>

      {/* 迷雾夜对照（双视角互补） */}
      <motion.section
        className="mt-4 rounded-card bg-white/5 p-5 ring-1 ring-white/10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.35 }}
      >
        <p className="mb-4 text-xs tracking-[0.25em] text-white/45">迷雾夜对照</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-night-soft/70 p-4">
            <p className="text-[11px] text-white/45">你在雾里</p>
            <p className="mt-2 text-sm font-medium leading-6 text-white">{me.fogLabel}</p>
            <p className="mt-1 text-[11px] leading-5 text-white/55">“{me.fogQuote}”</p>
          </div>
          <div className="rounded-2xl bg-night-soft/70 p-4">
            <p className="text-[11px] text-white/45">TA在雾里</p>
            <p className="mt-2 text-sm font-medium leading-6 text-white">{ta.fogLabel}</p>
            <p className="mt-1 text-[11px] leading-5 text-white/55">“{ta.fogQuote}”</p>
          </div>
        </div>
        <motion.div
          className={`mt-3 rounded-2xl p-4 text-sm leading-7 ${
            kind === 'friction' ? 'bg-sun/15 text-[#ffd9a0]' : 'bg-teal/15 text-[#8ee8de]'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          {verdict}
        </motion.div>
        <p className="mt-3 text-[11px] leading-5 text-white/40">
          匹配的不是「像不像」——是你们遇事的反应，能不能对上。
        </p>
      </motion.section>

      {/* 为什么是这个分数 */}
      {reasons.length > 0 && (
        <motion.section
          className="mt-4 rounded-card bg-white/5 p-5 ring-1 ring-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.55 }}
        >
          <p className="mb-3 text-xs tracking-[0.25em] text-white/45">契合与摩擦（引用你们的剧情证据）</p>
          <ul className="space-y-2.5">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] leading-6 text-white/75">
                {r.includes('——') && (r.includes('退让') || r.includes('委屈') || r.includes('烧得快') || r.includes('沉默') || r.includes('没人喊')) ? (
                  <Minus size={14} className="mt-1 shrink-0 text-sun" />
                ) : (
                  <Plus size={14} className="mt-1 shrink-0 text-teal" />
                )}
                {r}
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* 下一步：邀约 */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        {invitation ? (
          <Link
            href={`/invite/${matchId}`}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-teal text-base font-semibold text-white transition-transform active:scale-[0.98]"
          >
            {invitation.status === 'locked' ? '查看赴约卡' : '邀约进行中'} · {invitation.title}
          </Link>
        ) : (
          <Link
            href={`/invite/${matchId}`}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-coral text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,107,94,0.35)] transition-transform active:scale-[0.98]"
          >
            约TA见一面 <ArrowRight size={18} />
          </Link>
        )}
        <Link
          href="/"
          className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-full border border-white/20 text-sm text-white/60 transition-colors hover:text-white/80 active:scale-[0.98]"
        >
          返回首页
        </Link>
        <p className="mt-3 text-center text-[11px] text-white/40">线上理解的自然下一步，是一场具体的活动</p>
      </motion.div>
    </main>
  )
}

function SideChip({ side, label }: { side: Side; label: string }) {
  return (
    <div className="flex w-28 flex-col items-center gap-2 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-sun text-white">
        <IdentityIcon code={side.identity.code} size={20} />
      </div>
      <div className="text-center">
        <p className="text-[11px] text-white/45">{label}</p>
        <p className="text-sm font-medium leading-5 text-white">{side.nickname}</p>
        <p className="mt-0.5 text-[10px] text-white/45">{side.identity.name}</p>
      </div>
    </div>
  )
}
