'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'
import { getMyUserId, clearIdentity } from '@/lib/client-device'
import { UserAvatar } from '@/components/Avatar'
import TabBar from '@/components/TabBar'

interface MatchRow {
  userId: string
  nickname: string
  avatar: string | null
  age: number
  city: string
  identity: string
  matchPercent: number
}
interface ResultData {
  gameKey: string
  gameName: string
  matchPoints: number
  matches: MatchRow[]
  successCount: number
}

export default function VaneResultPage() {
  const router = useRouter()
  const [data, setData] = useState<ResultData | null>(null)
  const [liking, setLiking] = useState<string | null>(null)
  const [likeError, setLikeError] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('island_vane_result')
    if (raw) setData(JSON.parse(raw))
  }, [])

  async function like(m: MatchRow) {
    const myId = getMyUserId()
    if (!myId || liking) return
    setLiking(m.userId)
    const res = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId: myId, toUserId: m.userId }),
    })
    if (!res.ok) {
      clearIdentity()
      setLikeError('登录状态过期，请重新登岛后再心动')
      setLiking(null)
      return
    }
    const d = await res.json()
    if (d.matched && d.matchId) {
      router.push(`/match/${d.matchId}`)
      return
    }
    setLikeError(`已向 ${m.identity}·${m.nickname} 发出心动，TA也心动就会配对（在我的里可看）`)
    setLiking(null)
  }

  if (!data) {
    return (
      <main className="shell flex min-h-[100dvh] items-center justify-center bg-paper">
        <p className="text-sm text-ink-soft">没有结果，先去玩一局</p>
      </main>
    )
  }

  return (
    <main className="shell bg-paper px-5 pb-28 pt-7">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-[11px] tracking-[0.3em] text-ink-soft">{data.gameName} · 选择重合度</p>
        <h1 className="font-display mt-2 text-2xl text-ink">
          {data.successCount > 0 ? (
            <>{data.successCount} 位异性与你默契在线</>
          ) : (
            <>暂时还没有高度重合的人</>
          )}
        </h1>
        <p className="mt-1.5 text-[11px] text-ink-soft">
          共 {data.matchPoints} 个匹配点 · 重合度 = 相同选择 ÷ 匹配点
        </p>
      </motion.header>

      <div className="mt-6 space-y-3">
        {data.matches.map((m, i) => (
          <motion.section
            key={m.userId}
            className="rounded-card bg-card p-4 shadow-sm"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.06, 0.4) }}
          >
            <div className="flex items-center gap-3">
              {i < 3 && (
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${i === 0 ? 'bg-coral' : i === 1 ? 'bg-sun' : 'bg-teal'}`}>
                  {i + 1}
                </span>
              )}
              <UserAvatar avatar={m.avatar} seed={m.userId} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {m.identity} <span className="text-xs font-normal text-ink-soft">· {m.nickname}</span>
                </p>
                <p className="text-[11px] text-ink-soft">{m.city} · {m.age} 岁</p>
              </div>
              <div className="w-20 shrink-0">
                <div className="flex items-baseline justify-end gap-0.5">
                  <span className={`font-display text-2xl ${m.matchPercent >= 66 ? 'text-coral-deep' : 'text-ink'}`}>{m.matchPercent}</span>
                  <span className="text-[10px] text-ink-soft">%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#ece8de]">
                  <motion.div
                    className={`h-full rounded-full ${m.matchPercent >= 66 ? 'bg-coral' : 'bg-teal'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.matchPercent}%` }}
                    transition={{ duration: 0.7, delay: 0.2 + Math.min(i * 0.05, 0.3) }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => like(m)}
              disabled={liking === m.userId}
              className={`mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60 ${
                m.matchPercent >= 66 ? 'bg-coral' : 'bg-night'
              }`}
            >
              <Heart size={15} /> {liking === m.userId ? '正在发出心动…' : '心动，想认识'}
            </button>
          </motion.section>
        ))}
      </div>

      {likeError && <p className="mt-4 text-center text-xs text-coral-deep">{likeError}</p>}
      <p className="mt-6 flex items-center justify-center gap-1 text-[11px] text-ink-soft">
        <Sparkles size={12} className="text-teal" /> 重合度 ≥ 66% 可直接心动，进入契合解读与邀约
      </p>
      <TabBar />
    </main>
  )
}
