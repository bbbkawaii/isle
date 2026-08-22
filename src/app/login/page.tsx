'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, LogIn } from 'lucide-react'
import { setMyUserId } from '@/lib/client-device'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    if (busy) return
    setBusy(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '登录失败')
      setBusy(false)
      return
    }
    // 恢复本地身份（形象/性别/最新一局）
    setMyUserId(data.userId)
    if (data.avatar) localStorage.setItem('island_avatar', data.avatar)
    if (data.gender) localStorage.setItem('island_gender', data.gender)
    if (data.sessionId) localStorage.setItem('island_session_id', data.sessionId)
    router.replace('/')
  }

  return (
    <main className="shell bg-paper px-5 pb-10 pt-8">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="返回" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-card shadow-sm">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <p className="text-[11px] text-ink-soft">邮箱登录</p>
        <span className="w-10" />
      </div>

      <motion.div className="mt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl text-ink">欢迎回到岛上</h1>
        <p className="mt-2 text-xs leading-5 text-ink-soft">
          用注册登岛证时的邮箱和密码登录，配对与邀约记录都会回来。
        </p>
      </motion.div>

      <div className="mt-6 space-y-4 rounded-card bg-card p-5 shadow-sm">
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
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="h-12 w-full rounded-xl border border-[#e2ded4] bg-card px-3 text-sm text-ink outline-none focus:border-coral"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-center text-xs text-coral-deep">{error}</p>}

      <button
        onClick={login}
        disabled={busy}
        className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-coral text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,107,94,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <LogIn size={18} /> {busy ? '正在登岛……' : '登录'}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-soft">
        还没有账号？完成登岛问答、办理登岛证时会自动注册
      </p>
    </main>
  )
}
