'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, ImagePlus, RefreshCw, Wand2 } from 'lucide-react'
import Avatar, { type AvatarConfig, HAIR_COLORS, SKINS, OUTFITS, HAIR_NAMES, ACC_NAMES } from '@/components/Avatar'
import { getMyUserId } from '@/lib/client-device'

const DEFAULT: AvatarConfig = { hair: 1, hairColor: HAIR_COLORS[3], skin: SKINS[0], outfit: OUTFITS[0], acc: 1 }

export default function AvatarPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'photo' | 'manual'>('photo')
  const [gender, setGender] = useState<string>(typeof window !== 'undefined' ? localStorage.getItem('island_gender') ?? '' : '')
  const [nickname, setNickname] = useState<string>(typeof window !== 'undefined' ? localStorage.getItem('island_nickname') ?? '' : '')

  // 照片转绘状态
  const [preview, setPreview] = useState<string | null>(null) // 本地预览 dataURL
  const [blob, setBlob] = useState<Blob | null>(null)
  const [result, setResult] = useState<string | null>(null) // 生成结果 URL
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // 捏脸状态
  const [cfg, setCfg] = useState<AvatarConfig>(DEFAULT)

  useEffect(() => {
    if (!busy) return
    setElapsed(0)
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [busy])

  function set<K extends keyof AvatarConfig>(k: K, v: AvatarConfig[K]) {
    setCfg((c) => ({ ...c, [k]: v }))
  }

  // 选照片：客户端压缩到 1024px，保证上传快
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
        setError('转绘模型还没配置（等 Key 到位后自动生效），先手动捏一个吧')
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
    if (!nickname.trim()) {
      setErrorMsg('先给自己起个昵称')
      return
    }
    if (!gender) {
      setErrorMsg('先选择你的性别')
      return
    }
    localStorage.setItem('island_nickname', nickname.trim())
    localStorage.setItem('island_gender', gender)
    localStorage.setItem('island_avatar', avatarValue)
    // 已登记用户同步入库，别人立即可见新形象
    const userId = getMyUserId()
    if (userId) {
      fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, avatar: avatarValue }),
      }).catch(() => {})
    }
    router.replace('/')
  }

  return (
    <main className="shell bg-paper px-5 pb-10 pt-10">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
          <h1 className="font-display text-3xl text-ink">设计你的岛上形象</h1>
        <p className="mt-2 text-xs leading-5 text-ink-soft">
          在岛上，大家先认识你的回答，再认识你。
          <br />
          这个形象会代替照片，出现在匿名阶段。
        </p>
        </motion.div>
        <Link href="/login" className="ml-3 shrink-0 rounded-full border border-[#e2ded4] px-3 py-2 text-[11px] text-ink-soft">
          已有账号？登录
        </Link>
      </div>

      {/* 昵称：岛上怎么称呼你 */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-ink-soft">昵称（岛上怎么称呼你）</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 12))}
          placeholder="如：守灯人"
          className="h-12 w-full rounded-xl border border-[#e2ded4] bg-card px-3 text-sm text-ink outline-none focus:border-coral"
        />
      </div>

      {/* 性别（异性互配，最前置的匹配信息） */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-ink-soft">你的性别（屿见按异性匹配）</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { v: 'female', l: '女生' },
            { v: 'male', l: '男生' },
          ].map((g) => (
            <button
              key={g.v}
              onClick={() => setGender(g.v)}
              className={`h-11 cursor-pointer rounded-full border text-sm transition-colors duration-200 ${
                gender === g.v ? 'border-coral bg-coral/10 font-semibold text-coral-deep' : 'border-[#e2ded4] text-ink-soft'
              }`}
            >
              {g.l}
            </button>
          ))}
        </div>
      </div>

      {/* 模式切换 */}
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-[#edeae1] p-1">
        {([
          ['photo', '照片转绘'],
          ['manual', '手动捏脸'],
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
        {/* —— 照片转绘 —— */}
        {mode === 'photo' && (
          <motion.div key="photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
            <div className="rounded-card bg-gradient-to-b from-[#14263a] to-[#1d4a5f] p-6 text-center text-white shadow-sm">
              {result ? (
                <motion.div key={result} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <span className="mx-auto block h-40 w-40 overflow-hidden rounded-full ring-4 ring-white/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result} alt="你的岛上形象" className="h-full w-full object-cover" style={{ transform: 'scale(1.28)', transformOrigin: '50% 36%' }} />
                  </span>
                  <p className="mt-3 text-xs text-white/60">你的岛上居民形象</p>
                </motion.div>
              ) : busy ? (
                <div className="flex h-40 flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="flex h-16 w-16 items-center justify-center rounded-3xl bg-coral shadow-[0_0_40px_rgba(255,107,94,0.5)]"
                  >
                    <Wand2 size={30} />
                  </motion.div>
                  <p className="mt-4 text-sm">正在把照片画成岛上居民… {elapsed}s</p>
                  <p className="mt-1 text-[11px] text-white/45">AI 转绘约需 15~60 秒</p>
                </div>
              ) : preview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="待转绘照片" className="mx-auto h-40 w-40 rounded-2xl object-cover" />
                  <p className="mt-3 text-xs text-white/60">原图</p>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 text-white/60"
                >
                  <ImagePlus size={30} />
                  <span className="text-sm">上传一张你的照片</span>
                  <span className="text-[11px] text-white/40">会转绘成统一的卡通岛上形象，只保留神态不露真容</span>
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && pickPhoto(e.target.files[0])}
            />

            {error && <p className="mt-3 text-center text-xs text-coral-deep">{error}</p>}

            <div className="mt-4 flex gap-3">
              {(preview || result) && !busy && (
                <button
                  onClick={() => { setPreview(null); setBlob(null); setResult(null); setError(''); fileRef.current?.click() }}
                  className="flex h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#e2ded4] py-4 text-sm text-ink-soft active:bg-[#f0ede5]"
                >
                  <RefreshCw size={15} /> {result ? '换张照片' : '重选'}
                </button>
              )}
              {result ? (
                <button
                  onClick={() => save(result)}
                  className="flex h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-coral py-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,94,0.4)] active:scale-[0.98]"
                >
                  <Check size={16} /> 就是这个，登岛
                </button>
              ) : null}
              {result && !busy && (
                <button
                  onClick={generate}
                  className="flex h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-night py-4 text-sm font-semibold text-white active:scale-[0.98]"
                >
                  <Sparkles size={15} /> 不满意再来一张
                </button>
              )}
              {preview && !result && !busy && (
                <button
                  onClick={generate}
                  className="flex h-13 flex-[1.6] cursor-pointer items-center justify-center gap-2 rounded-full bg-coral py-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,94,0.4)] active:scale-[0.98]"
                >
                  <Sparkles size={15} /> 生成我的岛上形象
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* —— 手动捏脸 —— */}
        {mode === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
            <div className="flex flex-col items-center rounded-card bg-gradient-to-b from-[#14263a] to-[#1d4a5f] py-8 shadow-sm">
              <motion.div key={JSON.stringify(cfg)} initial={{ scale: 0.92, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}>
                <Avatar config={cfg} size={150} />
              </motion.div>
              <p className="mt-3 text-xs text-white/50">你的角色投影</p>
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
              <Check size={18} /> 就是这个，登岛
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMsg && <p className="mt-4 text-center text-xs text-coral-deep">{errorMsg}</p>}
      <p className="mt-4 text-center text-[11px] text-ink-soft">形象随时可以在「我的」里重新生成</p>
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
