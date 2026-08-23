'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, MapPin } from 'lucide-react'
import { getMyUserId, clearIdentity } from '@/lib/client-device'
import { UserAvatar } from '@/components/Avatar'

interface Candidate {
  userId: string
  nickname: string
  age: number
  city: string
  height: number | null
  avatar: string | null
  score: number
  overlapPercent: number | null
  identity: { code: string; name: string; core: string; tags: string[] }
}

export default function CandidatesPage() {
  const router = useRouter()
  const [list, setList] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState<string | null>(null)
  const [noUser, setNoUser] = useState(false)

  useEffect(() => {
    const userId = getMyUserId()
    if (!userId) {
      setNoUser(true)
      setLoading(false)
      return
    }
    fetch(`/api/candidates?userId=${userId}`)
      .then(async (r) => {
        if (!r.ok) {
          // 登岛证过期（服务端数据重置）：清身份走重新登岛引导
          clearIdentity()
          setNoUser(true)
          return null
        }
        return r.json()
      })
      .then((d) => { if (d) setList(d.candidates ?? []) })
      .finally(() => setLoading(false))
  }, [])

  async function like(c: Candidate) {
    if (liking) return
    setLiking(c.userId)
    const res = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId: getMyUserId(), toUserId: c.userId }),
    })
    if (!res.ok) {
      clearIdentity()
      setNoUser(true)
      setLiking(null)
      return
    }
    const data = await res.json()
    if (data.matched && data.matchId) {
      router.push(`/match/${data.matchId}`)
      return
    }
    // 未匹配（真实双方）：从列表移除，等待对方
    setList((l) => l.filter((x) => x.userId !== c.userId))
    setLiking(null)
  }

  function skip(userId: string) {
    setList((l) => l.filter((x) => x.userId !== userId))
  }

  if (noUser) {
    return (
      <main className="shell flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-8 text-center">
        <p className="text-sm text-ink-soft">先登录、登岛并填写资料，才能看到同船的人</p>
        <Link href="/" className="mt-6 flex h-12 items-center justify-center rounded-full bg-coral px-8 font-semibold text-white">
          回首页
        </Link>
      </main>
    )
  }

  return (
    <main className="shell bg-paper px-5 pb-10 pt-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">和你同船的人</h1>
          <p className="mt-1 text-xs text-ink-soft">双向门槛已通过 · 按契合指数排序</p>
        </div>
        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs text-teal">{list.length} 位岛民</span>
      </div>

      {loading && <p className="mt-16 text-center text-sm text-ink-soft">正在检查航线……</p>}

      {!loading && list.length === 0 && (
        <div className="mt-16 rounded-card bg-card p-8 text-center shadow-sm">
          <p className="font-display text-lg text-ink">TA 们还在另一座岛</p>
          <p className="mt-3 text-xs leading-6 text-ink-soft">
            你的航线有点窄——放宽城市或年龄，
            <br />会多出几个可能认识的人。
          </p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {list.map((c, i) => (
          <motion.section
            key={c.userId}
            className="rounded-card bg-card p-5 shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <UserAvatar avatar={c.avatar} seed={c.userId} size={56} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-display text-lg text-ink">{c.nickname}</h2>
                  <span className="shrink-0 rounded-full bg-coral/10 px-2 py-0.5 text-[10px] text-coral-deep">{c.identity.name}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">{c.identity.core}</p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-soft">
                  <MapPin size={12} />
                  {c.city} · {c.age} 岁{c.height ? ` · ${c.height}cm` : ''}
                </p>
                <p className="mt-1">
                  <span className="font-display text-xl text-coral-deep">{c.score}</span>
                  <span className="ml-1 text-[10px] text-ink-soft">契合指数</span>
                  {c.overlapPercent != null && (
                    <span className="ml-2 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] text-teal">剧情重合 {c.overlapPercent}%</span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.identity.tags.map((t, i) => (
                    <span key={t} className={`chip ${['chip-coral', 'chip-sage', 'chip-sky', 'chip-sand'][i % 4]}`}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => skip(c.userId)}
                className="h-12 flex-1 cursor-pointer rounded-full border border-[#e2ded4] text-sm text-ink-soft transition-colors duration-200 active:bg-[#f0ede5]"
              >
                换个人
              </button>
              <button
                onClick={() => like(c)}
                disabled={liking === c.userId}
                className="flex h-12 flex-[1.6] cursor-pointer items-center justify-center gap-2 rounded-full bg-coral text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {liking === c.userId ? (
                  '等TA回应……'
                ) : (
                  <>
                    <Heart size={16} /> 心动，想认识
                  </>
                )}
              </button>
            </div>
          </motion.section>
        ))}
      </div>

      {!loading && list.length > 0 && (
        <p className="mt-8 flex items-center justify-center gap-1 text-[11px] text-ink-soft">
          心动是双向的，两边都按下才会配对 <ArrowRight size={12} />
        </p>
      )}

      {!loading && (
        <Link
          href="/"
          className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[#e2ded4] text-sm text-ink-soft transition-colors duration-200 hover:bg-[#f0ede5] active:scale-[0.98]"
        >
          返回首页
        </Link>
      )}
    </main>
  )
}
