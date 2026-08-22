'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { getDeviceToken, setMyUserId } from '@/lib/client-device'

const CITIES = ['上海', '杭州', '北京', '深圳', '广州', '成都', '南京', '苏州', '武汉', '西安', '其他']
const YEARS = Array.from({ length: 22 }, (_, i) => 2006 - i)
const EDU = [
  { v: 'high_school', l: '高中及以下' },
  { v: 'college', l: '大专' },
  { v: 'bachelor', l: '本科' },
  { v: 'master', l: '硕士' },
  { v: 'phd', l: '博士' },
]
const INTENTS = [
  { v: 'serious', l: '认真恋爱' },
  { v: 'friends', l: '先交朋友看看' },
  { v: 'expand', l: '拓展社交圈' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [gender, setGender] = useState<string>(typeof window !== 'undefined' ? localStorage.getItem('island_gender') ?? '' : '')
  const [birthYear, setBirthYear] = useState(1998)
  const [city, setCity] = useState('上海')
  const [education, setEducation] = useState('bachelor')
  const [height, setHeight] = useState('')
  const [intent, setIntent] = useState('serious')
  const [cityScope, setCityScope] = useState('same_city')
  const [eduReq, setEduReq] = useState('none')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPrefs, setShowPrefs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!gender) {
      setError('选择你的性别（本产品为异性匹配）')
      return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceToken: getDeviceToken(),
        avatar: localStorage.getItem('island_avatar'),
        email,
        password,
        gender,
        birthYear,
        city,
        education,
        height: height || null,
        intent,
        ageMin: birthYear - 5,
        ageMax: birthYear + 7,
        cityScope,
        eduReq,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '登记失败')
      setSubmitting(false)
      return
    }
    setMyUserId(data.userId)
    router.push('/')
  }

  const selectCls =
    'h-12 w-full cursor-pointer appearance-none rounded-xl border border-[#e2ded4] bg-card px-3 text-sm text-ink outline-none focus:border-coral'

  return (
    <main className="shell bg-paper px-5 pb-10 pt-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl text-ink">登岛登记</h1>
        <p className="mt-2 text-xs leading-5 text-ink-soft">
          先上岛玩的是游客，想留下来认识人，需要办一张登岛证。
          <br />
          硬门槛决定你们能不能上同一座岛，契合指数决定你们会不会被排到彼此面前。
        </p>
      </motion.div>

      {/* 账号：邮箱 + 密码（换设备也能找回身份） */}
      <div className="mt-6 space-y-4 rounded-card bg-card p-5 shadow-sm">
        <p className="text-xs font-medium text-ink-soft">账号（邮箱 + 密码，换设备可登录找回）</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          className={selectCls}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="密码（至少 6 位）"
          className={selectCls}
        />
      </div>

      <div className="mt-4 space-y-4 rounded-card bg-card p-5 shadow-sm">
        {/* 性别 */}
        <div>
          <label className="mb-2 block text-xs font-medium text-ink-soft">性别（异性互配）</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: 'female', l: '女生' },
              { v: 'male', l: '男生' },
            ].map((g) => (
              <button
                key={g.v}
                type="button"
                onClick={() => setGender(g.v)}
                className={`h-12 cursor-pointer rounded-xl border text-sm transition-colors duration-200 ${
                  gender === g.v ? 'border-coral bg-coral/10 font-semibold text-coral-deep' : 'border-[#e2ded4] text-ink-soft'
                }`}
              >
                {g.l}
              </button>
            ))}
          </div>
        </div>

        {/* 出生年份 / 城市 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-soft">出生年份</label>
            <div className="relative">
              <select value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} className={selectCls}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-4 text-ink-soft" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-soft">城市</label>
            <div className="relative">
              <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-4 text-ink-soft" />
            </div>
          </div>
        </div>

        {/* 学历 */}
        <div>
          <label className="mb-2 block text-xs font-medium text-ink-soft">学历</label>
          <div className="relative">
            <select value={education} onChange={(e) => setEducation(e.target.value)} className={selectCls}>
              {EDU.map((e) => (
                <option key={e.v} value={e.v}>{e.l}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-4 text-ink-soft" />
          </div>
        </div>

        {/* 选填：身高 / 交友目的 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-soft">身高 cm（选填）</label>
            <input
              value={height}
              onChange={(e) => setHeight(e.target.value.replace(/\D/g, '').slice(0, 3))}
              inputMode="numeric"
              placeholder="如 168"
              className={selectCls}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-soft">交友目的</label>
            <div className="relative">
              <select value={intent} onChange={(e) => setIntent(e.target.value)} className={selectCls}>
                {INTENTS.map((i) => (
                  <option key={i.v} value={i.v}>{i.l}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-4 text-ink-soft" />
            </div>
          </div>
        </div>
      </div>

      {/* 门槛偏好（可折叠，默认宽进） */}
      <button
        type="button"
        onClick={() => setShowPrefs(!showPrefs)}
        className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-card bg-card px-5 py-4 text-sm shadow-sm"
      >
        <span className="text-ink">我的门槛偏好 <span className="text-xs text-ink-soft">（双向生效，默认宽进）</span></span>
        <ChevronDown size={18} className={`text-ink-soft transition-transform duration-200 ${showPrefs ? 'rotate-180' : ''}`} />
      </button>
      {showPrefs && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <div className="mt-2 space-y-4 rounded-card bg-card p-5 shadow-sm">
            <div>
              <label className="mb-2 block text-xs font-medium text-ink-soft">
                年龄范围：{2026 - birthYear - 5} ~ {2026 - birthYear + 7} 岁（对方）
              </label>
              <p className="text-xs text-[#a8a294]">默认比你小 5 岁到大 7 岁，本 demo 不单独调整</p>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-ink-soft">城市要求</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'same_city', l: '同城' },
                  { v: 'any', l: '不限' },
                ].map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    onClick={() => setCityScope(c.v)}
                    className={`h-11 cursor-pointer rounded-xl border text-sm transition-colors duration-200 ${
                      cityScope === c.v ? 'border-teal bg-teal/10 font-semibold text-teal' : 'border-[#e2ded4] text-ink-soft'
                    }`}
                  >
                    {c.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-ink-soft">对方学历要求</label>
              <div className="relative">
                <select value={eduReq} onChange={(e) => setEduReq(e.target.value)} className={selectCls}>
                  <option value="none">不限</option>
                  <option value="bachelor">本科及以上</option>
                  <option value="master">硕士及以上</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-4 text-ink-soft" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {error && <p className="mt-4 text-center text-xs text-coral-deep">{error}</p>}
      <p className="mt-4 text-center text-[11px] text-ink-soft">
        已有账号？<Link href="/login" className="text-coral-deep underline">直接登录</Link>，不用重新登记
      </p>

      <button
        onClick={submit}
        disabled={submitting}
        className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-coral text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,107,94,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? '登记中……' : '领取登岛证，去认识人'}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-soft">
        门槛是你自己的选择，平台只负责双向尊重 ·{' '}
        <Link href="/" className="underline">回首页</Link>
      </p>
    </main>
  )
}
