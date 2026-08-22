'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Crown } from 'lucide-react'
import { getVaneGame, resolveField, bgForNode, type Gender, type VaneNode } from '@/lib/content/vane-games'
import { getMyUserId } from '@/lib/client-device'

// vane DAG 剧情引擎：dialog 点击推进 / choice 分支选择 / ending 结局
// 男女双视角：文案按性别解析，选项 id 男女一致（匹配可比）

interface Answer {
  nodeId: string
  optionId: string
}

// 选项徽标：内部 id（q2_a / A）→ 展示字母
function optLabel(id: string, index: number): string {
  const tail = id.split('_').pop() ?? ''
  return /^[a-zA-Z]$/.test(tail) ? tail.toUpperCase() : String(index + 1)
}

export default function VanePlayPage() {
  const { key } = useParams<{ key: string }>()
  const router = useRouter()
  const game = getVaneGame(Array.isArray(key) ? key[0] : key)

  const [gender, setGender] = useState<Gender | null>(null)
  const [gate, setGate] = useState<'checking' | 'need-play' | 'need-register' | 'ok'>('checking')
  const [nodeId, setNodeId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [roleHint, setRoleHint] = useState('')
  const lastSpeaker = useRef<string>('')

  // 门槛检查按用户阶段分流：没玩过五幕→去玩；玩过没登记→去办登岛证
  useEffect(() => {
    const userId = getMyUserId()
    const sessionId = localStorage.getItem('island_session_id')
    if (!userId && !sessionId) {
      setGate('need-play')
      return
    }
    const qs = new URLSearchParams()
    if (userId) qs.set('userId', userId)
    if (sessionId) qs.set('sessionId', sessionId)
    fetch(`/api/status?${qs}`)
      .then((r) => r.json())
      .then((st) => {
        if (st.stage === 'registered' && userId) {
          fetch(`/api/me?userId=${userId}`)
            .then((r) => r.json())
            .then((d) => {
              setGender(d.user.gender as Gender)
              setGate('ok')
            })
            .catch(() => setGate('need-register'))
        } else if (st.stage === 'played') {
          setGate('need-register')
        } else {
          setGate('need-play')
        }
      })
      .catch(() => setGate('need-play'))
  }, [])

  // 进度持久化：刷新/退出可续玩（与五幕引擎行为一致）
  useEffect(() => {
    if (!game || nodeId !== null) return
    try {
      const raw = JSON.parse(localStorage.getItem('island_vane_progress') || 'null')
      if (raw?.gameKey === game.id && game.nodes[raw.nodeId]) {
        setNodeId(raw.nodeId)
        setAnswers(raw.answers ?? [])
        return
      }
    } catch {
      /* 损坏则重开 */
    }
    setNodeId(game.start_node)
  }, [game, nodeId])

  useEffect(() => {
    if (!game || !nodeId) return
    localStorage.setItem('island_vane_progress', JSON.stringify({ gameKey: game.id, nodeId, answers }))
  }, [game, nodeId, answers])

  // 双角色：说话人切换时提示「此刻，你替××作答」
  useEffect(() => {
    if (!game || !nodeId || !gender) return
    const node = game.nodes[nodeId]
    if (!node) return
    const speaker = resolveField(node.speaker, gender)
    if (speaker && speaker !== lastSpeaker.current && lastSpeaker.current !== '') {
      setRoleHint(speaker)
      const t = setTimeout(() => setRoleHint(''), 1600)
      lastSpeaker.current = speaker
      return () => clearTimeout(t)
    }
    if (speaker) lastSpeaker.current = speaker
  }, [nodeId, game, gender])

  if (!game) {
    return (
      <main className="shell flex min-h-[100dvh] items-center justify-center bg-paper px-8 text-center">
        <p className="text-sm text-ink-soft">游戏不存在</p>
      </main>
    )
  }

  if (gate === 'need-register') {
    return (
      <main className="shell flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-8 text-center">
        <p className="font-display text-lg text-ink">办张登岛证就能玩了</p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">你已经完成登岛问答，只差登记这一步——剧情匹配需要知道你的视角</p>
        <Link href="/register" className="mt-6 flex h-12 items-center justify-center rounded-full bg-coral px-8 text-sm font-semibold text-white">
          办理登岛证
        </Link>
        <Link href="/play" className="mt-3 text-xs text-ink-soft underline">重新回答登岛问答</Link>
      </main>
    )
  }

  if (gate === 'need-play') {
    return (
      <main className="shell flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-8 text-center">
        <p className="font-display text-lg text-ink">先登岛，再来玩剧情</p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">剧情匹配需要知道你的视角（性别）</p>
        <Link href="/play" className="mt-6 flex h-12 items-center justify-center rounded-full bg-coral px-8 text-sm font-semibold text-white">
          去登岛开局
        </Link>
      </main>
    )
  }

  if (gate === 'checking' || !gender || !nodeId) {
    return (
      <main className="shell flex min-h-[100dvh] items-center justify-center bg-paper">
        <p className="text-sm text-ink-soft">正在翻开剧本……</p>
      </main>
    )
  }

  const node: VaneNode | undefined = game.nodes[nodeId]
  const bgUrl = nodeId ? bgForNode(game.id, nodeId) : null

  function advance(next: string) {
    setNodeId(next)
  }

  function choose(optionId: string, next: string) {
    setAnswers((a) => [...a.filter((x) => x.nodeId !== nodeId), { nodeId: nodeId!, optionId }])
    advance(next)
  }

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/vane/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: getMyUserId(), gameKey: game!.id, answers }),
    })
    if (!res.ok) {
      setError('提交失败，再试一次')
      setSubmitting(false)
      return
    }
    const data = await res.json()
    localStorage.removeItem('island_vane_progress')
    localStorage.setItem('island_vane_result', JSON.stringify(data))
    router.push(`/games/${game!.id}/result`)
  }

  return (
    <main className="shell shell-night overflow-hidden select-none">
      {/* 背景：剧情背景图（按幕切换，交叉淡入）或默认深色渐变 */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={bgUrl ?? 'gradient'}
          className="absolute inset-0 bg-cover bg-center"
          style={
            bgUrl
              ? { backgroundImage: `url(${bgUrl})` }
              : { background: 'linear-gradient(180deg,#101a2c 0%,#16233a 55%,#0e1420 100%)' }
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-night/55 via-transparent to-night/90" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-5 pb-6 pt-6">
        {/* 顶栏 */}
        <div className="flex items-center justify-between">
          <Link href="/games" aria-label="返回广场" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/8">
            <ArrowLeft size={18} className="text-white/80" />
          </Link>
          <p className="text-[11px] tracking-[0.25em] text-white/50">
            {game.name}
            {game.dual_role && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">双角色</span>}
          </p>
          <span className="w-10 text-right text-[11px] text-white/40">{answers.length} 选</span>
        </div>

        {/* 双角色提示 */}
        <AnimatePresence>
          {roleHint && (
            <motion.div
              className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full bg-sun/20 px-4 py-1.5 text-xs text-[#ffd9a0]"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              此刻，你替「{roleHint}」作答
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        <AnimatePresence mode="wait">
          {/* 对话节点 */}
          {node?.type === 'dialog' && (
            <motion.div
              key={nodeId}
              className="relative rounded-3xl border border-white/15 bg-[#0d1320]/85 p-4 pt-6 backdrop-blur-md"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
            >
              <div className="absolute -top-3.5 left-4 rounded-full bg-teal px-4 py-1 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(15,181,166,0.4)]">
                {resolveField(node.speaker, gender) || '旁白'}
              </div>
              <p className="min-h-[4rem] text-[15px] leading-8 text-white/95">{resolveField(node.text, gender)}</p>
              <div className="mt-2 flex items-center justify-end">
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-white/50">
                  ▼
                </motion.span>
              </div>
              <button onClick={() => advance(node.next!)} className="absolute inset-0 cursor-pointer rounded-3xl" aria-label="继续" />
            </motion.div>
          )}

          {/* 选择节点 */}
          {node?.type === 'choice' && (
            <motion.div
              key={nodeId}
              className="space-y-2.5"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
            >
              <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-[14px] leading-7 text-white/90">
                <p className="mb-1 text-[11px] text-white/45">{resolveField(node.speaker, gender) || '旁白'}</p>
                {resolveField(node.text, gender)}
              </div>
              {(node.options ?? []).map((opt, i) => (
                <motion.button
                  key={opt.id}
                  onClick={() => choose(opt.id, opt.next)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-white/25 bg-[#0d1320]/60 px-4 py-3.5 text-left backdrop-blur-md transition-all duration-200 hover:border-coral/70 active:scale-[0.98]"
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-white/85">
                    {optLabel(opt.id, i)}
                  </span>
                  <span className="text-sm leading-6 text-white">{resolveField(opt.text, gender)}</span>
                  {opt.match_point && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-teal" title="参与匹配" />}
                </motion.button>
              ))}
              <p className="pt-1 text-right text-[10px] text-white/30">带绿点的选择将参与匹配</p>
            </motion.div>
          )}

          {/* 结局节点 */}
          {node?.type === 'ending' && (
            <motion.div
              key={nodeId}
              className="rounded-3xl border border-sun/30 bg-[#0d1320]/85 p-6 text-center backdrop-blur-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              {game.dual_role && <Crown size={28} className="mx-auto text-sun" />}
              <p className="font-display mt-3 text-xl text-white">{resolveField(node.ending_title, gender)}</p>
              <p className="mt-2 text-xs text-white/50">本次共 {answers.length} 个选择</p>
              {error && <p className="mt-2 text-xs text-coral">{error}</p>}
              <button
                onClick={submit}
                disabled={submitting}
                className="mt-5 flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-coral py-4 text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,107,94,0.45)] transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? '正在计算重合度……' : '查看匹配结果'} <ArrowRight size={17} />
              </button>
              <Link href="/games" className="mt-3 block text-xs text-white/45 underline">先不匹配，回广场</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
