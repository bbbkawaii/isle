'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'
import { setMyUserId } from '@/lib/client-device'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function applySession(data: { userId: string; avatar?: string | null; gender?: string | null; nickname?: string | null; sessionId?: string | null }) {
    setMyUserId(data.userId)
    if (data.avatar) localStorage.setItem('island_avatar', data.avatar)
    if (data.gender) localStorage.setItem('island_gender', data.gender)
    if (data.nickname) localStorage.setItem('island_nickname', data.nickname)
    if (data.sessionId) localStorage.setItem('island_session_id', data.sessionId)
  }

  async function submit() {
    if (busy) return
    setBusy(true)
    setError('')
    const path = tab === 'signup' ? '/api/auth/signup' : '/api/auth/login'
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? (tab === 'signup' ? '注册失败' : '登录失败'))
      setBusy(false)
      return
    }
    applySession(data)
    router.replace('/')
  }

  return (
    <main className="shell bg-paper px-5 pb-10 pt-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs tracking-[0.3em] text-ink-soft">ISLEMEET</p>
        <h1 className="font-display mt-2 text-3xl text-ink">欢迎来到屿见</h1>
        <p className="mt-2 text-xs leading-5 text-ink-soft">先登录，再登岛，玩完再填资料。账号用邮箱和密码就行。</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-[#edeae1] p-1">
        {([
          ['signup', '注册'],
          ['login', '登录'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => { setTab(k); setError('') }}
            className={`h-10 cursor-pointer rounded-full text-sm transition-colors ${
              tab === k ? 'bg-card font-semibold text-ink shadow-sm' : 'text-ink-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4 rounded-card bg-card p-5 shadow-sm">
        <div>
          <label className="mb-2 block text-xs font-medium text-ink-soft">邮箱</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border border-[#e2ded4] bg-card px-3 text-sm text-ink outline-none focus:border-coral"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-ink-soft">密码</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="至少 6 位"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="h-12 w-full rounded-xl border border-[#e2ded4] bg-card px-3 text-sm text-ink outline-none focus:border-coral"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-center text-xs text-coral-deep">{error}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-coral text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,107,94,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <LogIn size={18} /> {busy ? '请稍等……' : tab === 'signup' ? '注册，去登岛' : '登录'}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-soft">
        {tab === 'signup' ? '注册后先玩登岛问答，资料后面再填' : '登录后会回到你上次的进度'}
      </p>
    </main>
  )
}
