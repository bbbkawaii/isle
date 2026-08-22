'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, Send, Lock, Check, Clock, MapPin, Sparkles } from 'lucide-react'
import { getMyUserId } from '@/lib/client-device'
import IdentityIcon from '@/components/IdentityIcon'

interface Activity {
  id: number
  title: string
  timeDesc: string
  place: string
  icebreak: string
  fitTags: string[]
}
interface Side {
  userId: string
  nickname: string
  identity: { code: string; name: string }
}
interface InvitationData {
  id: string
  status: string
  inviteText: string
  counterReason: string | null
  round: number
  initiatorId: string
  activity: Activity
}

interface Props {
  matchId: string
  fogVerdict: string
  sides: [Side, Side]
  activities: Activity[]
  invitation: InvitationData | null
}

const COUNTER_REASONS = ['想换个安静点的地方', '这个时间我有事', '想选走走停停一点的', '想换个有意思一点的']

type Step = 'compose' | 'sent' | 'ta' | 'counter' | 'locked' | 'declined'

export default function InviteView({ matchId, fogVerdict, sides, activities, invitation: initialInvitation }: Props) {
  const myId = getMyUserId() ?? sides[0].userId
  const me = sides.find((s) => s.userId === myId) ?? sides[0]
  const ta = sides.find((s) => s.userId !== me.userId) ?? sides[1]

  const [invitation, setInvitation] = useState<InvitationData | null>(initialInvitation)
  const [step, setStep] = useState<Step>(
    initialInvitation
      ? initialInvitation.status === 'locked'
        ? 'locked'
        : initialInvitation.status === 'counter'
          ? 'counter'
          : initialInvitation.status === 'declined'
            ? 'declined'
            : 'sent'
      : 'compose',
  )
  const [pick, setPick] = useState(0) // compose 阶段选中的活动下标
  const [busy, setBusy] = useState(false)

  // 推荐排序：fitTags 与你们俩身份的交集
  const ordered = useMemo(() => {
    const codes = new Set([me.identity.code, ta.identity.code])
    return [...activities].sort(
      (a, b) => b.fitTags.filter((t) => codes.has(t)).length - a.fitTags.filter((t) => codes.has(t)).length,
    )
  }, [activities, me.identity.code, ta.identity.code])

  async function send(activityId: number) {
    if (busy) return
    setBusy(true)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, activityId, initiatorId: myId }),
    })
    const data = await res.json()
    if (res.ok) {
      setInvitation(data.invitation)
      setStep('sent')
    }
    setBusy(false)
  }

  async function respond(action: 'accept' | 'counter' | 'decline', reason?: string) {
    if (!invitation || busy) return
    setBusy(true)
    const res = await fetch(`/api/invite/${invitation.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    })
    const data = await res.json()
    if (res.ok) {
      setInvitation(data.invitation)
      setStep(action === 'accept' ? 'locked' : action === 'counter' ? 'counter' : 'declined')
    }
    setBusy(false)
  }

  return (
    <main className="shell bg-paper px-5 pb-12 pt-8">
      <header className="mb-5 flex items-center gap-3">
        <div className="flex -space-x-2">
          {[me, ta].map((s) => (
            <span key={s.userId} className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#14263a] to-[#1d4a5f] text-white ring-2 ring-paper">
              <IdentityIcon code={s.identity.code} size={16} />
            </span>
          ))}
        </div>
        <div>
          <h1 className="font-display text-xl leading-6 text-ink">
            {me.identity.name} <span className="text-xs font-normal text-ink-soft">×</span> {ta.identity.name}
          </h1>
          <p className="text-[11px] text-ink-soft">把这次配对，变成一次具体的见面</p>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* —— ① 发起：选活动 —— */}
        {step === 'compose' && (
          <motion.section key="compose" {...fade}>
            <p className="mb-3 flex items-center gap-1.5 text-xs text-teal">
              <Sparkles size={14} /> AI 根据你们的岛居动线推荐
            </p>
            <ActivityCard a={ordered[pick]} recommended={pick === 0} />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setPick((p) => (p + 1) % ordered.length)}
                className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#e2ded4] text-sm text-ink-soft transition-colors duration-200 active:bg-[#f0ede5]"
              >
                <RefreshCw size={15} /> 换一个
              </button>
              <button
                onClick={() => send(ordered[pick].id)}
                disabled={busy}
                className="flex h-12 flex-[1.6] cursor-pointer items-center justify-center gap-2 rounded-full bg-coral text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                <Send size={15} /> {busy ? '生成邀请语中……' : '发送邀约（邀请语 AI 代写）'}
              </button>
            </div>
          </motion.section>
        )}

        {/* —— ② 已发送：我的视角 —— */}
        {step === 'sent' && invitation && (
          <motion.section key="sent" {...fade}>
            <ActivityCard a={invitation.activity} />
            <div className="mt-3 rounded-card bg-card p-4 shadow-sm">
              <p className="text-[11px] text-ink-soft">你代写的邀请语</p>
              <p className="mt-2 text-sm leading-7 text-ink">{invitation.inviteText}</p>
            </div>
            <p className="mt-3 text-center text-[11px] text-ink-soft">等待 TA 回应……</p>
            <button
              onClick={() => setStep('ta')}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-night py-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              切换到 TA 的视角，替 TA 看看 <IdentityIcon code={ta.identity.code} size={16} />
            </button>
          </motion.section>
        )}

        {/* —— ③ TA 的确认页 —— */}
        {step === 'ta' && invitation && (
          <motion.section key="ta" {...fade}>
            <div className="mb-4 flex items-center justify-between rounded-full bg-night px-4 py-2.5 text-xs text-white/80">
              <span>视角已切换 · 现在你是「{ta.nickname}」</span>
              <button onClick={() => setStep('sent')} className="cursor-pointer text-white/50 underline">切回</button>
            </div>
            <p className="mb-2 text-xs leading-6 text-ink-soft">
              「{me.nickname}」（{me.identity.name}）邀请你参加。你们的迷雾夜判词：{fogVerdict}
            </p>
            <ActivityCard a={invitation.activity} />
            <div className="mt-4 space-y-3">
              <button
                onClick={() => respond('accept')}
                disabled={busy}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-teal py-4 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                <Check size={16} /> 接受，去见面
              </button>
              <details className="rounded-card bg-card shadow-sm">
                <summary className="flex h-12 cursor-pointer list-none items-center justify-center text-sm text-ink-soft">
                  <RefreshCw size={14} className="mr-2" /> 换一个活动（附理由）
                </summary>
                <div className="space-y-2 px-4 pb-4">
                  {COUNTER_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => respond('counter', r)}
                      className="h-11 w-full cursor-pointer rounded-xl border border-[#e2ded4] text-xs text-ink transition-colors duration-200 active:bg-[#f0ede5]"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </details>
              <button
                onClick={() => respond('decline')}
                className="h-12 w-full cursor-pointer rounded-full text-xs text-ink-soft underline"
              >
                婉拒（不解释也没关系）
              </button>
            </div>
          </motion.section>
        )}

        {/* —— ④ TA 想换：重新选 —— */}
        {step === 'counter' && invitation && (
          <motion.section key="counter" {...fade}>
            <div className="rounded-card bg-sun/15 p-4 text-sm leading-7 text-[#7a5a1e]">
              TA 想换一个活动：<span className="font-medium">“{invitation.counterReason}”</span>
              <br />
              <span className="text-xs">换活动不是拒绝——TA 只是在协商。</span>
            </div>
            <p className="mb-3 mt-5 text-xs text-ink-soft">换哪个：</p>
            <div className="space-y-3">
              {ordered
                .filter((a) => a.id !== invitation.activity.id)
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => send(a.id)}
                    disabled={busy}
                    className="w-full cursor-pointer rounded-card bg-card p-4 text-left shadow-sm ring-1 ring-transparent transition-all duration-200 hover:ring-coral/40 active:scale-[0.99]"
                  >
                    <p className="text-sm font-medium text-ink">{a.title}</p>
                    <p className="mt-1 text-xs text-ink-soft">{a.timeDesc} · {a.place}</p>
                  </button>
                ))}
            </div>
          </motion.section>
        )}

        {/* —— ⑤ 成局：赴约卡 —— */}
        {step === 'locked' && invitation && (
          <motion.section key="locked" {...fade}>
            {/* 两卡合拢 */}
            <div className="relative flex h-24 items-center justify-center">
              <motion.div
                className="absolute flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-sun text-white shadow-lg"
                initial={{ x: -70, opacity: 0, rotate: -8 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              >
                <IdentityIcon code={me.identity.code} size={24} />
              </motion.div>
              <motion.div
                className="absolute flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#14263a] to-[#1d4a5f] text-white shadow-lg"
                initial={{ x: 70, opacity: 0, rotate: 8 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              >
                <IdentityIcon code={ta.identity.code} size={24} />
              </motion.div>
              <motion.span
                className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal text-white ring-4 ring-paper"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.55, type: 'spring', stiffness: 300, damping: 15 }}
              >
                <Check size={16} strokeWidth={3} />
              </motion.span>
            </div>
            <motion.p
              className="font-display mt-2 text-center text-xl text-ink"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              成局 · 双方确认赴约
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
              className="mt-5 rounded-card bg-gradient-to-br from-[#14263a] to-[#1d4a5f] p-5 text-white shadow-sm"
            >
              <p className="text-xs tracking-[0.25em] text-white/50">赴约卡</p>
              <h2 className="font-display mt-3 text-xl">{invitation.activity.title}</h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/75">
                <Clock size={14} /> {invitation.activity.timeDesc}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                <MapPin size={14} /> {invitation.activity.place}
              </p>
              <div className="mt-4 rounded-2xl bg-white/8 p-4">
                <p className="flex items-center gap-2 text-xs text-[#ffd9a0]">
                  <Lock size={13} /> 线下终章 · 到达现场解锁
                </p>
                <p className="mt-2 text-[13px] leading-6 text-white/80 blur-[5px] select-none">
                  {invitation.activity.icebreak}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="mt-4 rounded-card border border-dashed border-[#d8d2c6] p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <p className="text-[11px] text-ink-soft">活动结束后，你们可以各自选择（只有双方都愿意，才有下一章）：</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['继续写下一章', '更适合做朋友', '想再了解一次', '到这里就很好'].map((t) => (
                  <span key={t} className="rounded-full bg-[#f0ede5] px-3 py-1 text-[11px] text-ink-soft">{t}</span>
                ))}
              </div>
            </motion.div>

            <motion.p
              className="mt-6 text-center text-[11px] leading-5 text-ink-soft"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              首次见面建议选择公共场所 · 行程可分享给紧急联系人
            </motion.p>
          </motion.section>
        )}

        {/* —— 婉拒 —— */}
        {step === 'declined' && (
          <motion.section key="declined" {...fade} className="mt-16 text-center">
            <p className="font-display text-xl text-ink">这次没有成局</p>
            <p className="mt-3 text-xs leading-6 text-ink-soft">
              婉拒不需要解释，也没有任何提示发给对方。
              <br />岛上还有别人，正准备认识你。
            </p>
            <Link
              href="/candidates"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-night px-8 text-sm font-semibold text-white"
            >
              回到候选池
            </Link>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.25 },
}

function ActivityCard({ a, recommended }: { a: Activity; recommended?: boolean }) {
  return (
    <div className="relative rounded-card bg-card p-5 shadow-sm">
      {recommended && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-teal px-2.5 py-0.5 text-[10px] font-medium text-white">
          为你们推荐
        </span>
      )}
      <h2 className="font-display text-lg leading-7 text-ink">{a.title}</h2>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
        <Clock size={13} /> {a.timeDesc}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
        <MapPin size={13} /> {a.place}
      </p>
      <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-xs leading-6 text-ink-soft">
        破冰任务预告：{a.icebreak}
      </p>
    </div>
  )
}
