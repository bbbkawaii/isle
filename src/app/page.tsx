'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Clock, MapPin, Play, ChevronRight } from 'lucide-react'
import { getMyUserId, clearIdentity } from '@/lib/client-device'
import { UserAvatar } from '@/components/Avatar'
import IdentityIcon from '@/components/IdentityIcon'
import { getIdentity } from '@/lib/content/identities'
import TabBar from '@/components/TabBar'

interface MatchCard {
  userId: string
  nickname: string
  age: number
  city: string
  height: number | null
  avatar: string | null
  identity: { code: string; name: string; core: string; tags: string[] }
  overlapPercent: number | null
  score: number
}
interface AnswerCard {
  userId: string
  nickname: string
  avatar: string | null
  city: string
  age: number
  identity: { code: string; name: string }
  scene: { no: number; title: string; subtitle: string; prompt: string }
  choice: { label: string; quote: string }
}
interface RelationCard {
  matchId: string
  score: number
  status: string
  activityTitle: string | null
  other: {
    nickname: string
    avatar: string | null
    identity: { code: string; name: string }
  }
}
interface ActivityCard {
  id: number
  title: string
  timeDesc: string
  place: string
  icebreak: string
}
type Stage = 'loading' | 'new' | 'played' | 'registered'

const STATUS_TEXT: Record<string, string> = {
  matched: '已配对 · 下一步约TA见面',
  sent: '邀约已发送 · 等TA回应',
  counter: 'TA 想换个活动 · 去协商',
  locked: '已成局 · 周末赴约',
  declined: '这次没有成局',
}

export default function HomePage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('loading')
  const [identityCode, setIdentityCode] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchCard[]>([])
  const [teaser, setTeaser] = useState<AnswerCard | null>(null)
  const [relation, setRelation] = useState<RelationCard | null>(null)
  const [activity, setActivity] = useState<ActivityCard | null>(null)
  const [liking, setLiking] = useState<string | null>(null)
  const [pendingMsg, setPendingMsg] = useState('')
  const [avatarRaw, setAvatarRaw] = useState<string | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('island_avatar')) {
      router.replace('/avatar')
      return
    }
    setAvatarRaw(localStorage.getItem('island_avatar'))

    const userId = getMyUserId()
    const sessionId = localStorage.getItem('island_session_id')
    const qs = new URLSearchParams()
    if (userId) qs.set('userId', userId)
    if (sessionId) qs.set('sessionId', sessionId)

    Promise.all([
      fetch(`/api/status?${qs}`).then((r) => r.json()),
      fetch(`/api/feed${userId ? `?userId=${userId}` : ''}`).then((r) => r.json()),
      userId ? fetch(`/api/candidates?userId=${userId}`).then((r) => (r.ok ? r.json() : { candidates: [] })) : Promise.resolve({ candidates: [] }),
    ])
      .then(([status, feed, cand]) => {
        setStage(status.stage)
        setIdentityCode(status.identity ?? null)
        setTeaser(feed.answerCards?.[0] ?? null)
        setRelation(feed.relationCard ?? null)
        setActivity(feed.activityCard ?? null)
        setMatches(cand.candidates ?? [])
      })
      .catch(() => setStage('new'))
  }, [router])

  async function like(c: MatchCard) {
    const myId = getMyUserId()
    if (!myId || liking) return
    setLiking(c.userId)
    const res = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId: myId, toUserId: c.userId }),
    })
    if (!res.ok) {
      clearIdentity()
      setMatches([])
      setLiking(null)
      return
    }
    const data = await res.json()
    if (data.matched && data.matchId) {
      router.push(`/match/${data.matchId}`)
      return
    }
    setMatches((l) => l.filter((x) => x.userId !== c.userId))
    setPendingMsg(`已向 ${c.identity.name}·${c.nickname} 发出心动，TA也心动就会配对（在我的里可看）`)
    setLiking(null)
  }

  const identity = identityCode ? getIdentity(identityCode) : null

  return (
    <main className="shell bg-paper px-5 pb-28 pt-6">
      {/* 头部 */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl leading-7 text-ink">屿见</h1>
          <p className="mt-0.5 text-[11px] text-ink-soft">先遇见回答，再遇见人</p>
        </div>
        <Link href="/profile" aria-label="我的">
          {avatarRaw && <UserAvatar avatar={avatarRaw} seed="me" size={40} ring />}
        </Link>
      </header>

      {stage === 'loading' && <p className="mt-16 text-center text-sm text-ink-soft">正在靠岸……</p>}

      {/* —— 新用户：三步引导 + 一张试读卡 —— */}
      {stage === 'new' && (
        <>
          <section className="rounded-card bg-gradient-to-br from-[#14263a] to-[#1d4a5f] p-6 text-white shadow-sm">
            <p className="text-xs text-white/55">欢迎上岛，三步开始</p>
            <div className="mt-4 space-y-3.5">
              {[
                ['玩一局五幕剧情', '5 分钟，测评藏在故事里'],
                ['拿到你的岛屿人格报告', '七种岛民，你住在哪里就是谁'],
                ['登岛，按契合指数配对', '双向心动，约一次真的见面'],
              ].map(([t, d], i) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t}</p>
                    <p className="text-[11px] text-white/50">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/play"
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-coral py-4 text-base font-semibold shadow-[0_8px_24px_rgba(255,107,94,0.45)] transition-transform active:scale-[0.98]"
            >
              <Play size={18} fill="currentColor" /> 开始第一局
            </Link>
          </section>

          {teaser && (
            <>
              <p className="mb-2.5 mt-6 text-xs font-medium text-ink-soft">岛上的人，正在这样回答 · 先偷看一眼</p>
              <TeaserSection card={teaser} />
            </>
          )}
        </>
      )}

      {/* —— 玩完未登记：身份 + 登岛证 CTA —— */}
      {stage === 'played' && identity && (
        <Link
          href={`/report/${localStorage.getItem('island_session_id') ?? ''}`}
          className="flex cursor-pointer items-center gap-3 rounded-card bg-gradient-to-br from-[#14263a] to-[#1d4a5f] p-5 text-white shadow-sm transition-transform active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral">
            <IdentityIcon code={identity.code} size={24} />
          </span>
          <div className="flex-1">
            <p className="text-[11px] text-white/50">你在岛上是</p>
            <p className="font-display text-lg">{identity.name}</p>
          </div>
          <ChevronRight size={18} className="text-white/50" />
        </Link>
      )}
      {stage === 'played' && (
        <>
          <Link
            href="/register"
            className="mt-3 flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-coral text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,107,94,0.35)] transition-transform active:scale-[0.98]"
          >
            办理登岛证，解锁配对 <ArrowRight size={18} />
          </Link>
          <p className="mt-3 text-center text-[11px] text-ink-soft">登记后即可看到和你同船的人与契合指数</p>
        </>
      )}

      {/* —— 已登记：契合指数列表 —— */}
      {stage === 'registered' && (
        <>
          {relation && (
            <>
              <p className="mb-2.5 text-xs font-medium text-ink-soft">我的配对</p>
              <RelationSection card={relation} />
            </>
          )}
          {pendingMsg && <p className="mb-3 rounded-2xl bg-teal/10 px-4 py-2.5 text-[11px] leading-5 text-teal">{pendingMsg}</p>}
          <p className="mb-2.5 mt-5 text-xs font-medium text-ink-soft">和你同船的人 · 按契合指数排序</p>
          <div className="space-y-3">
            {matches.map((c, i) => (
              <MatchSection key={c.userId} card={c} index={i} liking={liking === c.userId} onLike={() => like(c)} />
            ))}
            {matches.length === 0 && (
              <div className="rounded-card bg-card p-6 text-center shadow-sm">
                <p className="text-sm text-ink">TA 们还在另一座岛</p>
                <p className="mt-2 text-xs text-ink-soft">放宽城市或年龄偏好，会多出几个可能认识的人</p>
              </div>
            )}
          </div>
          {activity && (
            <div className="mt-4">
              <ActivitySection card={activity} />
            </div>
          )}
        </>
      )}

      <TabBar />
    </main>
  )
}

/* —— 契合指数卡（已登记首页主体）—— */
function MatchSection({ card, index, liking, onLike }: { card: MatchCard; index: number; liking: boolean; onLike: () => void }) {
  return (
    <motion.section
      className="rounded-card bg-card p-4 shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.3) }}
    >
      <div className="flex items-center gap-3">
        <UserAvatar avatar={card.avatar} seed={card.userId} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {card.identity.name} <span className="text-xs font-normal text-ink-soft">· {card.nickname}</span>
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">{card.city} · {card.age} 岁</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {card.identity.tags.map((t, i) => (
              <span key={t} className={`chip ${['chip-coral', 'chip-sage', 'chip-sky', 'chip-sand'][i % 4]}`}>{t}</span>
            ))}
            {card.overlapPercent != null && (
              <span className="chip chip-mauve">剧情重合 {card.overlapPercent}%</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl leading-none text-coral-deep">{card.score}</p>
          <p className="mt-1 text-[10px] text-ink-soft">契合指数</p>
        </div>
      </div>
      <button
        onClick={onLike}
        disabled={liking}
        className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-coral text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <Heart size={15} /> {liking ? '正在发出心动…' : '心动，想认识'}
      </button>
    </motion.section>
  )
}

/* —— 新用户试读卡 —— */
function TeaserSection({ card }: { card: AnswerCard }) {
  return (
    <section className="rounded-card bg-card p-5 shadow-sm">
      <p className="text-[11px] tracking-wide text-ink-soft">
        {card.scene.title} · {card.scene.subtitle}
      </p>
      <p className="font-display mt-1.5 text-[15px] leading-6 text-ink">{card.scene.prompt}</p>
      <div className="mt-3 rounded-2xl bg-paper px-4 py-3">
        <p className="text-sm font-medium leading-6 text-ink">“{card.choice.label}”</p>
        <p className="mt-1 text-xs leading-5 text-ink-soft">理由：{card.choice.quote}</p>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <UserAvatar avatar={card.avatar} seed={card.userId} size={34} />
        <p className="truncate text-xs text-ink">
          {card.identity.name} · <span className="text-ink-soft">{card.nickname}</span>
        </p>
      </div>
    </section>
  )
}

/* —— 关系进度卡：对方形象 + 身份 + 进度 + 契合指数 —— */
function RelationSection({ card }: { card: RelationCard }) {
  return (
    <Link
      href={`/match/${card.matchId}`}
      className="block cursor-pointer rounded-card border border-teal/30 bg-teal/8 p-4 transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <UserAvatar avatar={card.other.avatar} seed={card.matchId} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {card.other.identity.name} <span className="text-xs font-normal text-ink-soft">· {card.other.nickname}</span>
          </p>
          <p className="mt-1 text-xs text-teal">{STATUS_TEXT[card.status] ?? '已配对'}</p>
          {card.activityTitle && <p className="mt-0.5 text-xs text-ink-soft">{card.activityTitle}</p>}
        </div>
        <div className="text-right">
          <p className="font-display text-2xl text-teal">{card.score}</p>
          <p className="text-[10px] text-ink-soft">契合指数</p>
        </div>
      </div>
      <div className="mt-3 flex h-9 items-center justify-center gap-1 rounded-full bg-teal/15 text-xs font-medium text-teal">
        查看契合解读 <ArrowRight size={13} />
      </div>
    </Link>
  )
}

/* —— 活动卡 —— */
function ActivitySection({ card }: { card: ActivityCard }) {
  return (
    <section className="rounded-card bg-card p-5 shadow-sm">
      <p className="text-[11px] text-ink-soft">岛上正在发生</p>
      <h3 className="font-display mt-1.5 text-base leading-6 text-ink">{card.title}</h3>
      <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-soft"><Clock size={12} /> {card.timeDesc}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft"><MapPin size={12} /> {card.place}</p>
      <Link
        href="/candidates"
        className="mt-3 flex h-11 cursor-pointer items-center justify-center rounded-full bg-coral text-sm font-semibold text-white transition-transform active:scale-[0.98]"
      >
        去认识同船的人
      </Link>
    </section>
  )
}
