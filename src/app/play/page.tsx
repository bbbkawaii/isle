'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Wrench, BookOpen, Gift, Feather, Compass, Coffee, TreePine, Megaphone,
  Zap, Repeat, Search, Hourglass, Shield, DoorOpen, Scale, HeartHandshake,
  Ship, Tent, Contact, Heart, type LucideIcon,
} from 'lucide-react'
import { SCENES } from '@/lib/content/scenes'
import { getDeviceToken, getMyUserId } from '@/lib/client-device'

const ICONS: Record<string, LucideIcon> = {
  Wrench, BookOpen, Gift, Feather, Compass, Coffee, TreePine, Megaphone,
  Zap, Repeat, Search, Hourglass, Shield, DoorOpen, Scale, HeartHandshake,
  Ship, Tent, Contact, Heart,
}

export default function PlayPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [lineIdx, setLineIdx] = useState(0)
  const [phase, setPhase] = useState<'dialogue' | 'choices'>('dialogue')
  const [selected, setSelected] = useState<number | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState(false)
  const sceneStart = useRef<number>(Date.now())

  useEffect(() => {
    const deviceToken = getDeviceToken()
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceToken }),
    })
      .then((r) => r.json())
      .then((d: { sessionId: string; answers: { sceneNo: number; optionId: number }[] }) => {
        setSessionId(d.sessionId)
        localStorage.setItem('island_session_id', d.sessionId)
        if (d.answers.length >= SCENES.length) setIndex(SCENES.length - 1)
        else setIndex(d.answers.length)
      })
      .catch(() => router.push('/'))
  }, [router])

  useEffect(() => {
    sceneStart.current = Date.now()
    setSelected(null)
  }, [index])

  function advanceDialog() {
    const scene = SCENES[index]
    if (lineIdx < scene.lines.length - 1) {
      setLineIdx(lineIdx + 1)
    } else {
      sceneStart.current = Date.now() // 选项计时从对话结束开始
      setPhase('choices')
    }
  }

  function handleTap() {
    if (phase === 'dialogue') advanceDialog()
    else if (selected !== null) {
      // 选项已选、独白已出：再次点击可提前进入下一幕（节流由 choose 控制）
    }
  }

  // 终幕结算：报告生成成功才跳转（失败可重试），不再盲目导航
  async function submitReport(sid: string): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, userId: getMyUserId() ?? undefined }),
        })
        if (res.ok) return true
      } catch {
        // 服务重启/网络抖动，稍后重试
      }
      await new Promise((r) => setTimeout(r, 1200))
    }
    return false
  }

  async function finishRun() {
    if (!sessionId) return
    setFinishError(false)
    const ok = await submitReport(sessionId)
    if (ok) {
      setTimeout(() => router.push(`/report/${sessionId}`), 1600)
    } else {
      setFinishError(true)
    }
  }

  function choose(optionId: number) {
    if (!sessionId || selected !== null || finishing) return
    const scene = SCENES[index]
    const decisionMs = Date.now() - sceneStart.current
    setSelected(optionId)
    fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, sceneNo: scene.no, optionId, decisionMs }),
    }).catch(() => {})
    setTimeout(() => {
      if (index < SCENES.length - 1) {
        setIndex(index + 1)
        setLineIdx(0)
        setPhase('dialogue')
      } else {
        setFinishing(true)
        void finishRun()
      }
    }, 1500)
  }

  const scene = SCENES[index]
  const line = scene.lines[Math.min(lineIdx, scene.lines.length - 1)]

  return (
    <main className="shell shell-night overflow-hidden select-none">
      {/* 背景图：幕间交叉淡入 */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={scene.code}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${scene.bg})` }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </AnimatePresence>
      {/* 上下渐变压暗，保证可读性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-night/60 via-transparent to-night/85" />

      {/* 收尾：镜头拉远看全岛 */}
      <AnimatePresence>
        {finishing && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-night px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* 一盏灯亮起：登岛完成 */}
            <div className="relative flex h-40 items-center justify-center">
              <motion.span
                className="absolute h-16 w-16 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,184,77,0.55) 0%, rgba(255,184,77,0) 70%)' }}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 1.8, 1.2], opacity: [0, 1, 0.8] }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
              />
              <motion.span
                className="relative flex h-12 w-12 items-center justify-center rounded-full bg-sun shadow-[0_0_50px_18px_rgba(255,184,77,0.45)]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 14 }}
              >
                <span className="h-4 w-4 rounded-full bg-white/90" />
              </motion.span>
            </div>
            <motion.p
              className="font-display mt-6 text-lg text-white/90"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              登岛完成，你在岛上有了自己的位置
            </motion.p>
            {finishError ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                <p className="text-xs text-[#ffb0a6]">报告生成失败（服务可能刚重启）</p>
                <button
                  onClick={(e) => { e.stopPropagation(); void finishRun() }}
                  className="mt-3 cursor-pointer rounded-full bg-coral px-6 py-2.5 text-sm font-semibold text-white"
                >
                  重试
                </button>
              </motion.div>
            ) : (
              <motion.p
                className="mt-2 text-xs text-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9 }}
              >
                正在生成你的岛屿人格报告……
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-5 pb-6 pt-6" onClick={handleTap}>
        {/* 顶部：幕数与进度 */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.3em] text-white/60">
            {scene.title} · {scene.subtitle}
          </p>
          <div className="flex items-center gap-1.5">
            {SCENES.map((s, i) => (
              <motion.span
                key={s.code}
                className="h-1.5 rounded-full"
                animate={{
                  width: i === index ? 22 : 6,
                  backgroundColor: i < index ? 'rgba(255,255,255,0.65)' : i === index ? '#ff6b5e' : 'rgba(255,255,255,0.3)',
                }}
                transition={{ duration: 0.35 }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* 岛灵立绘：右侧，呼吸浮动 */}
        <AnimatePresence mode="wait">
          {phase === 'dialogue' && (
            <motion.div
              key={'sprite-' + scene.code}
              className="absolute bottom-0 right-0 z-0"
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
            >
              <motion.img
                src="/sprites/guide.png"
                alt="岛灵小屿"
                className="h-[47dvh] w-auto max-w-[75vw] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                draggable={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 对话框 */}
        <AnimatePresence mode="wait">
          {phase === 'dialogue' && (
            <motion.div
              key={scene.code + '-' + lineIdx}
              className="relative z-10 rounded-3xl border border-white/15 bg-[#0d1320]/85 p-4 pt-6 backdrop-blur-md"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 名牌 */}
              <div className="absolute -top-3.5 left-4 rounded-full bg-coral px-4 py-1 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(255,107,94,0.5)]">
                {line.speaker}
              </div>
              <GalText key={scene.code + '-' + lineIdx} text={line.text} onDone={() => {}} />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-white/35">点击对话框继续</span>
                <motion.span
                  className="text-white/50"
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ▼
                </motion.span>
              </div>
              <button
                onClick={advanceDialog}
                className="absolute inset-0 cursor-pointer rounded-3xl"
                aria-label="继续对话"
              />
            </motion.div>
          )}

          {/* 选项浮层 */}
          {phase === 'choices' && (
            <motion.div
              key={'choices-' + scene.code}
              className="relative z-10 space-y-2.5 pb-1"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <p className="font-display mb-3 text-center text-[15px] text-white/95 drop-shadow">{scene.prompt}</p>
              {scene.options.map((opt, i) => {
                const Icon = ICONS[opt.icon] ?? Heart
                const isSel = selected === opt.id
                return (
                  <motion.button
                    key={opt.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      choose(opt.id)
                    }}
                    disabled={selected !== null}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left backdrop-blur-md transition-all duration-300 ${
                      isSel
                        ? 'border-coral bg-coral/25'
                        : selected !== null
                          ? 'border-white/10 bg-[#0d1320]/60 opacity-30'
                          : 'border-white/25 bg-[#0d1320]/55 hover:border-white/50'
                    }`}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -36 : 36 }}
                    animate={
                      selected !== null && !isSel
                        ? { opacity: 0.3, x: 0 }
                        : { opacity: 1, x: 0 }
                    }
                    transition={{ duration: 0.35, delay: selected === null ? 0.1 + i * 0.1 : 0 }}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                        isSel ? 'bg-coral text-white' : 'bg-white/12 text-white/85'
                      }`}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{opt.label}</span>
                      <AnimatePresence>
                        {isSel && (
                          <motion.span
                            className="font-display mt-1 block border-l-2 border-coral/80 pl-2 text-xs leading-5 text-white/90"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                          >
                            “{opt.quote}”
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

/* GalGame 打字机：一次一幕台词 */
function GalText({ text, onDone }: { text: string; onDone: () => void }) {
  const [shown, setShown] = useState('')
  const done = useRef(false)
  const doneCb = useRef(onDone)
  doneCb.current = onDone

  useEffect(() => {
    setShown('')
    done.current = false
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setShown(text)
      return
    }
    let i = 0
    const timer = setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        if (!done.current) {
          done.current = true
          doneCb.current()
        }
      }
    }, 38)
    return () => clearInterval(timer)
  }, [text])

  const skip = useCallback(() => {
    setShown(text)
  }, [text])

  return (
    <div onClick={skip} className="cursor-pointer">
      <p className="min-h-[4.5rem] text-[15px] leading-8 text-white/95">
        {shown}
        {shown.length < text.length && <span className="animate-pulse">▍</span>}
      </p>
    </div>
  )
}
