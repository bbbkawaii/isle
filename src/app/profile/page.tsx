'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronDown, MapPin, Heart, PenLine } from 'lucide-react'
import { getMyUserId, clearIdentity } from '@/lib/client-device'
import { UserAvatar } from '@/components/Avatar'
import IdentityIcon from '@/components/IdentityIcon'
import TabBar from '@/components/TabBar'

interface MeData {
  registered: boolean
  profileComplete?: boolean
  user?: {
    nickname: string | null
    avatar: string | null
    gender: string
    age: number
    city: string
    education: string
    height: number | null
    sessionId: string | null
    prefs: { ageMin: number; ageMax: number; cityScope: string; eduReq: string }
  }
  report?: { sessionId: string; identity: string; identityCode: string; tags: string[] } | null
  matches?: {
    matchId: string
    score: number
    otherNickname: string
    otherIdentity: string
    otherAvatar: string | null
    invitationStatus: string | null
    activityTitle: string | null
  }[]
  pendingLikes?: {
    toUserId: string
    nickname: string
    avatar: string | null
    identity: string
  }[]
}

const EDU_LABEL: Record<string, string> = { high_school: '高中及以下', college: '大专', bachelor: '本科', master: '硕士', phd: '博士' }
const INVITE_TEXT: Record<string, string> = {
  sent: '邀约已发送',
  counter: 'TA想换个活动',
  locked: '已成局 · 待赴约',
  declined: '未成局',
}

export default function ProfilePage() {
  const router = useRouter()
  const [me, setMe] = useState<MeData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [avatarRaw, setAvatarRaw] = useState<string | null>(null)
  const [localNick, setLocalNick] = useState('')
  const [editingNick, setEditingNick] = useState(false)
  const [nickDraft, setNickDraft] = useState('')
  const [nickBusy, setNickBusy] = useState(false)

  useEffect(() => {
    setAvatarRaw(localStorage.getItem('island_avatar'))
    const storedNick = localStorage.getItem('island_nickname') ?? ''
    setLocalNick(storedNick)
    const userId = getMyUserId()
    if (!userId) {
      router.replace('/login')
      return
    }
    fetch(`/api/me?userId=${userId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('me failed')
        return r.json()
      })
      .then((d) => {
        if (!d.registered) {
          clearIdentity()
          router.replace('/login')
          return
        }
        if (d.user?.nickname) {
          localStorage.setItem('island_nickname', d.user.nickname)
          setLocalNick(d.user.nickname)
        }
        if (d.user?.gender) localStorage.setItem('island_gender', d.user.gender)
        if (d.user?.avatar) localStorage.setItem('island_avatar', d.user.avatar)
        setMe(d)
      })
      .catch(() => {
        setLoadError(true)
        setMe({ registered: false })
      })
      .finally(() => setLoaded(true))
  }, [])

  async function saveNick() {
    const name = nickDraft.trim().slice(0, 12)
    if (!name || nickBusy) return
    const userId = getMyUserId()
    setNickBusy(true)
    if (userId) {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nickname: name }),
      }).catch(() => null)
      if (!res?.ok) {
        setNickBusy(false)
        return
      }
    }
    localStorage.setItem('island_nickname', name)
    setLocalNick(name)
    setMe((d) => (d?.user ? { ...d, user: { ...d.user, nickname: name } } : d))
    setEditingNick(false)
    setNickBusy(false)
  }

  return (
    <main className="shell bg-paper px-5 pb-28 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-2xl leading-7 text-ink">我的</h1>
      </header>

      {/* 加载骨架：不闪「游客」 */}
      {!loaded && (
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-card bg-white/70" />
          <div className="h-16 animate-pulse rounded-card bg-white/70" />
          <div className="h-16 animate-pulse rounded-card bg-white/70" />
        </div>
      )}

      {/* 形象卡 */}
      {loaded && (
      <section className="rounded-card bg-gradient-to-b from-[#14263a] to-[#1d4a5f] p-5 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <UserAvatar avatar={me?.user?.avatar ?? avatarRaw} seed="me" size={64} ring />
          <div className="flex-1">
            <>
              <p className="font-display text-2xl leading-7">{me?.user?.nickname || localNick || '还没取名'}</p>
              {me?.report && (
                <span className="mt-1.5 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] text-white/80">
                  {me.report.identity}
                </span>
              )}
              <p className="mt-1 text-xs text-white/60">
                {loadError
                  ? '资料暂时没同步上'
                  : me?.user?.city
                    ? `${me.user.city}${me.user.age ? ` · ${me.user.age} 岁` : ''}`
                    : '资料还没填'}
              </p>
            </>
            {editingNick ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value.slice(0, 12))}
                  placeholder="岛上怎么称呼你"
                  className="h-8 flex-1 rounded-lg bg-white/10 px-2 text-xs text-white outline-none"
                />
                <button
                  onClick={() => void saveNick()}
                  disabled={nickBusy || !nickDraft.trim()}
                  className="h-8 rounded-full bg-coral px-3 text-[11px] font-semibold text-white disabled:opacity-50"
                >
                  {nickBusy ? '…' : '保存'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNickDraft(me?.user?.nickname ?? localNick)
                  setEditingNick(true)
                }}
                className="mt-2 text-[11px] text-white/70 underline"
              >
                {localNick || me?.user?.nickname ? '改昵称' : '设置昵称'}
              </button>
            )}
          </div>
          <Link
            href="/avatar"
            className="flex h-9 cursor-pointer items-center gap-1 rounded-full bg-white/10 px-3 text-xs text-white/80"
          >
            <PenLine size={13} /> 改形象
          </Link>
        </div>
      </section>
      )}

      {/* 未登记引导 */}
      {loaded && me?.registered && !me.profileComplete && (
        <section className="mt-4 rounded-card bg-card p-5 text-center shadow-sm">
          <p className="text-sm text-ink">{me.report ? '登岛完成，还差资料' : '还没登岛'}</p>
          <p className="mt-2 text-xs leading-5 text-ink-soft">
            {me.report ? '填一次资料就能按契合认识人' : '先玩登岛问答，再填写资料'}
          </p>
          <Link
            href={me.report ? '/register' : '/play'}
            className="mt-4 flex h-12 cursor-pointer items-center justify-center rounded-full bg-coral text-sm font-semibold text-white"
          >
            {me.report ? '填写资料' : '开始登岛'}
          </Link>
        </section>
      )}

      {/* 身份报告 */}
      {loaded && me?.report && (
        <Link
          href={`/report/${me.report.sessionId}`}
          className="mt-4 flex cursor-pointer items-center gap-3 rounded-card bg-card p-4 shadow-sm transition-transform active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-sun text-white">
            <IdentityIcon code={me.report.identityCode} size={22} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">我的岛屿人格报告</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {me.report.tags.slice(0, 2).map((t) => (
                <span key={t} className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] text-coral-deep">{t}</span>
              ))}
            </div>
          </div>
          <ChevronRight size={18} className="text-ink-soft" />
        </Link>
      )}

      {/* 发出的心动（等待对方回应） */}
      {loaded && me?.pendingLikes && me.pendingLikes.length > 0 && (
        <section className="mt-4">
          <p className="mb-2.5 text-xs font-medium text-ink-soft">我发出的心动 · 等TA也心动</p>
          <div className="space-y-2.5">
            {me.pendingLikes.map((l) => (
              <div key={l.toUserId} className="flex items-center gap-3 rounded-card bg-card p-3.5">
                <UserAvatar avatar={l.avatar} seed={l.toUserId} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base text-ink">{l.nickname}</p>
                  <p className="text-[11px] text-ink-soft">{l.identity}</p>
                  <p className="text-[11px] text-ink-soft">心动已送达，TA也心动时自动配对</p>
                </div>
                <span className="chip chip-sand">等待中</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 匹配记录 */}
      {loaded && me?.matches && me.matches.length > 0 && (
        <section className="mt-4">
          <p className="mb-2.5 text-xs font-medium text-ink-soft">我的配对</p>
          <div className="space-y-2.5">
            {me.matches.map((m) => (
              <Link
                key={m.matchId}
                href={`/match/${m.matchId}`}
                className="flex cursor-pointer items-center gap-3 rounded-card bg-card p-4 shadow-sm transition-transform active:scale-[0.99]"
              >
                <span className="relative shrink-0">
                  <UserAvatar avatar={m.otherAvatar} seed={m.matchId} size={44} />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-white ring-2 ring-card">
                    <Heart size={10} fill="currentColor" />
                  </span>
                </span>
                <div className="flex-1">
                  <p className="truncate font-display text-base text-ink">{m.otherNickname}</p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">{m.otherIdentity}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {m.invitationStatus ? `${INVITE_TEXT[m.invitationStatus] ?? ''}${m.activityTitle ? ` · ${m.activityTitle}` : ''}` : '已配对 · 待发起邀约'}
                  </p>
                </div>
                <span className="font-display text-xl text-coral-deep">{m.score}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 登岛证信息 */}
      {loaded && me?.profileComplete && me.user && (
        <section className="mt-4 rounded-card bg-card p-5 shadow-sm">
          <p className="mb-3 text-xs font-medium text-ink-soft">登岛证</p>
          <div className="grid grid-cols-2 gap-y-2.5 text-xs">
            <span className="text-ink-soft">城市</span><span className="flex items-center gap-1 text-ink"><MapPin size={12} />{me.user.city}</span>
            <span className="text-ink-soft">年龄</span><span className="text-ink">{me.user.age} 岁</span>
            <span className="text-ink-soft">学历</span><span className="text-ink">{EDU_LABEL[me.user.education] ?? me.user.education}</span>
            <span className="text-ink-soft">身高</span><span className="text-ink">{me.user.height ? `${me.user.height} cm` : '未填写'}</span>
          </div>
          <p className="mt-4 border-t border-dashed border-[#e2ded4] pt-3 text-[10px] leading-4 text-ink-soft">
            登岛门槛是你的选择，平台只负责双向尊重
          </p>
        </section>
      )}

      {loaded && me?.profileComplete && me.user?.prefs && <PrefsSection userId={getMyUserId() ?? ''} initial={me.user.prefs} />}

      {loaded && me?.registered && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
          {me.profileComplete && (
            <Link
              href="/candidates"
              className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-night text-sm font-semibold text-white"
            >
              回到候选池
            </Link>
          )}
          <button
            onClick={() => { clearIdentity(); location.href = '/login' }}
            className="h-11 w-full cursor-pointer rounded-full text-xs text-ink-soft underline"
          >
            退出登录（下次用邮箱登录找回）
          </button>
        </motion.div>
      )}

      <TabBar />
    </main>
  )
}

/* —— 匹配偏好编辑（候选池空状态「放宽偏好」的落点）—— */
function PrefsSection({ userId, initial }: { userId: string; initial: { ageMin: number; ageMax: number; cityScope: string; eduReq: string } }) {
  const [open, setOpen] = useState(false)
  const [ageMin, setAgeMin] = useState(initial.ageMin)
  const [ageMax, setAgeMax] = useState(initial.ageMax)
  const [cityScope, setCityScope] = useState(initial.cityScope)
  const [eduReq, setEduReq] = useState(initial.eduReq)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (busy) return
    setBusy(true)
    setMsg('')
    const res = await fetch('/api/user/prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ageMin, ageMax, cityScope, eduReq }),
    })
    const d = await res.json()
    setBusy(false)
    setMsg(res.ok ? '已保存，回首页会看到新的人' : d.error ?? '保存失败')
  }

  return (
    <section className="mt-4 rounded-card bg-card p-5 shadow-sm">
      <button onClick={() => setOpen(!open)} className="flex w-full cursor-pointer items-center justify-between text-xs font-medium text-ink-soft">
        匹配偏好（候选池空了就放宽一点）
        <ChevronDown size={15} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-[11px] text-ink-soft">对方出生年份：{ageMin} ~ {ageMax}（约 {2026 - ageMax}~{2026 - ageMin} 岁）</p>
            <div className="flex items-center gap-2">
              <input type="number" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} className="h-10 w-24 rounded-xl border border-[#e2ded4] px-2 text-center text-sm" />
              <span className="text-ink-soft">~</span>
              <input type="number" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} className="h-10 w-24 rounded-xl border border-[#e2ded4] px-2 text-center text-sm" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] text-ink-soft">城市要求</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[['same_city', '同城'], ['any', '不限']].map(([v, l]) => (
                <button key={v} onClick={() => setCityScope(v)} className={`h-10 cursor-pointer rounded-full border text-xs ${cityScope === v ? 'border-teal bg-teal/10 font-semibold text-teal' : 'border-[#e2ded4] text-ink-soft'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] text-ink-soft">对方学历要求</p>
            <div className="grid grid-cols-3 gap-2">
              {[['none', '不限'], ['bachelor', '本科+'], ['master', '硕士+']].map(([v, l]) => (
                <button key={v} onClick={() => setEduReq(v)} className={`h-10 cursor-pointer rounded-full border text-xs ${eduReq === v ? 'border-teal bg-teal/10 font-semibold text-teal' : 'border-[#e2ded4] text-ink-soft'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={busy} className="h-11 w-full cursor-pointer rounded-full bg-night text-sm font-semibold text-white disabled:opacity-60">
            {busy ? '保存中……' : '保存偏好'}
          </button>
          {msg && <p className="text-center text-[11px] text-coral-deep">{msg}</p>}
        </div>
      )}
    </section>
  )
}
