'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, Sparkles, ImagePlus, RefreshCw, Wand2 } from 'lucide-react'
import Avatar, { type AvatarConfig, HAIR_COLORS, SKINS, OUTFITS, HAIR_NAMES, ACC_NAMES, parseAvatar } from '@/components/Avatar'
import { getMyUserId } from '@/lib/client-device'

const DEFAULT: AvatarConfig = { hair: 1, hairColor: HAIR_COLORS[3], skin: SKINS[0], outfit: OUTFITS[0], acc: 1 }

export default function AvatarPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'photo' | 'manual'>('manual')
  const [preview, setPreview] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [cfg, setCfg] = useState<AvatarConfig>(DEFAULT)

  useEffect(() => {
    if (!getMyUserId()) {
      router.replace('/login')
      return
    }
    const stored = localStorage.getItem('island_avatar')
    const parsed = parseAvatar(stored)
    if (parsed) {
      setCfg(parsed)
      setMode('manual')
    } else if (stored && (stored.startsWith('http') || stored.startsWith('data:') || stored.startsWith('/'))) {
      setResult(stored)
      setMode('photo')
    }
  }, [router])

  useEffect(() => {
    if (!busy) return
    setElapsed(0)
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [busy])

  function set<K extends keyof AvatarConfig>(k: K, v: AvatarConfig[K]) {
    setCfg((c) => ({ ...c, [k]: v }))
  }

  function pickPhoto(file: File) {
    setError('')
    setResult(null)
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setPreview(dataUrl)
        canvas.toBlob((b) => setBlob(b), 'image/jpeg', 0.9)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function generate() {
    if (!blob || busy) return
    setBusy(true)
    setError('')
    const form = new FormData()
    form.append('photo', blob, 'photo.jpg')
    try {
      const res = await fetch('/api/avatar/edit', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok && data.url) {
        setResult(data.url)
      } else if (data.error === 'model_not_configured') {
        setError('转绘模型还没配置，先手动捏一个吧')
        setMode('manual')
      } else {
        setError('转绘失败了，再试一次或先手动捏一个')
      }
    } catch {
      setError('网络异常，再试一次')
    }
    setBusy(false)
  }

  async function save(avatarValue: string) {
    localStorage.setItem('island_avatar', avatarValue)
    const userId = getMyUserId()
    if (userId) {
      await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, avatar: avatarValue }),
      }).catch(() => {})
    }
    router.replace('/profile')
  }

  return (
    <main className="shell bg-paper px-5 pb-10 pt-8">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label="返回" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-card shadow-sm">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-ink">改形象</h1>
          <p className="mt-0.5 text-[11px] text-ink-soft">只改岛上怎么看你，昵称和资料在「填写资料」里</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-[#edeae1] p-1">
        {([
          ['manual', '手动捏脸'],
          ['photo', '照片转绘'],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`h-10 cursor-pointer rounded-full text-sm transition-colors duration-200 ${
              mode === m ? 'bg-card font-semibold text-ink shadow-sm' : 'text-ink-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'photo' && (
          <motion.div key="photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
            <div className="rounded-card bg-gradient-to-b from-[#14263a] to-[#1d4a5f] p-6 text-center text-white shadow-sm">
              {result ? (
                <motion.div key={result} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <span className="mx-auto block h-40 w-40 overflow-hidden rounded-full ring-4 ring-white/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result} alt="你的岛上形象" className="h-full w-full object-cover" style={{ transform: 'scale(1.28)', transformOrigin: '50% 36%' }} />
                  </span>
                </motion.div>
              ) : busy ? (
                <div className="flex h-40 flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="flex h-16 w-16 items-center justify-center rounded-3xl bg-coral"
                  >
                    <Wand2 size={30} />
                  </motion.div>
                  <p className="mt-4 text-sm">正在把照片画成岛上居民… {elapsed}s</p>
                </div>
              ) : preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="待转绘照片" className="mx-auto h-40 w-40 rounded-2xl object-cover" />
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 text-white/60"
                >
                  <ImagePlus size={30} />
                  <span className="text-sm">上传一张照片</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pickPhoto(e.target.files[0])} />
            {error && <p className="mt-3 text-center text-xs text-coral-deep">{error}</p>}
            <div className="mt-4 flex gap-3">
              {(preview || result) && !busy && (
                <button
                  onClick={() => { setPreview(null); setBlob(null); setResult(null); setError(''); fileRef.current?.click() }}
                  className="flex h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#e2ded4] py-4 text-sm text-ink-soft"
                >
                  <RefreshCw size={15} /> 换张照片
                </button>
              )}
              {result ? (
                <button
                  onClick={() => save(result)}
                  className="flex h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-coral py-4 text-sm font-semibold text-white"
                >
                  <Check size={16} /> 保存形象
                </button>
              ) : null}
              {preview && !result && !busy && (
                <button
                  onClick={generate}
                  className="flex h-13 flex-[1.6] cursor-pointer items-center justify-center gap-2 rounded-full bg-coral py-4 text-sm font-semibold text-white"
                >
                  <Sparkles size={15} /> 生成形象
                </button>
              )}
            </div>
          </motion.div>
        )}

        {mode === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
            <div className="flex flex-col items-center rounded-card bg-gradient-to-b from-[#14263a] to-[#1d4a5f] py-8 shadow-sm">
              <motion.div key={JSON.stringify(cfg)} initial={{ scale: 0.92, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}>
                <Avatar config={cfg} size={150} />
              </motion.div>
            </div>
            <div className="mt-5 space-y-5">
              <Row label="发型">
                {HAIR_NAMES.map((n, i) => (
                  <Chip key={n} active={cfg.hair === i} onClick={() => set('hair', i as AvatarConfig['hair'])}>{n}</Chip>
                ))}
              </Row>
              <Row label="发色">
                {HAIR_COLORS.map((c) => (
                  <button key={c} onClick={() => set('hairColor', c)} aria-label={`发色${c}`} className={`h-9 w-9 cursor-pointer rounded-full active:scale-90 ${cfg.hairColor === c ? 'ring-[3px] ring-coral ring-offset-2 ring-offset-paper' : ''}`} style={{ background: c }} />
                ))}
              </Row>
              <Row label="肤色">
                {SKINS.map((c) => (
                  <button key={c} onClick={() => set('skin', c)} aria-label={`肤色${c}`} className={`h-9 w-9 cursor-pointer rounded-full active:scale-90 ${cfg.skin === c ? 'ring-[3px] ring-coral ring-offset-2 ring-offset-paper' : ''}`} style={{ background: c }} />
                ))}
              </Row>
              <Row label="服装">
                {OUTFITS.map((c) => (
                  <button key={c} onClick={() => set('outfit', c)} aria-label={`服装${c}`} className={`h-9 w-9 cursor-pointer rounded-2xl active:scale-90 ${cfg.outfit === c ? 'ring-[3px] ring-coral ring-offset-2 ring-offset-paper' : ''}`} style={{ background: c }} />
                ))}
              </Row>
              <Row label="配饰">
                {ACC_NAMES.map((n, i) => (
                  <Chip key={n} active={cfg.acc === i} onClick={() => set('acc', i as AvatarConfig['acc'])}>{n}</Chip>
                ))}
              </Row>
            </div>
            <button
              onClick={() => save(JSON.stringify(cfg))}
              className="mt-8 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-coral text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,107,94,0.35)] active:scale-[0.98]"
            >
              <Check size={18} /> 保存形象
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-medium text-ink-soft">{label}</p>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 cursor-pointer rounded-full border px-4 text-xs transition-colors duration-200 ${
        active ? 'border-coral bg-coral/10 font-semibold text-coral-deep' : 'border-[#e2ded4] text-ink-soft'
      }`}
    >
      {children}
    </button>
  )
}
