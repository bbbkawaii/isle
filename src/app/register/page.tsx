'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { getDeviceToken, getMyUserId } from '@/lib/client-device'

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
  const [gender, setGender] = useState('')
  const [nickname, setNickname] = useState('')
  const [birthYear, setBirthYear] = useState(1998)
  const [city, setCity] = useState('上海')
  const [education, setEducation] = useState('bachelor')
  const [height, setHeight] = useState('')
  const [intent, setIntent] = useState('serious')
  const [cityScope, setCityScope] = useState('same_city')
  const [eduReq, setEduReq] = useState('none')
  const [showPrefs, setShowPrefs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getMyUserId()) {
      router.replace('/login')
      return
    }
    setNickname(localStorage.getItem('island_nickname') ?? '')
    setGender(localStorage.getItem('island_gender') ?? '')
  }, [router])

  async function submit() {
    if (!nickname.trim()) {
      setError('先给自己起个昵称')
      return
    }
    if (!gender) {
      setError('请选择性别')
      return
    }
    const userId = getMyUserId()
    if (!userId) {
      router.replace('/login')
      return
    }
    setSubmitting(true)
    setError('')
    localStorage.setItem('island_nickname', nickname.trim())
    localStorage.setItem('island_gender', gender)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        deviceToken: getDeviceToken(),
        avatar: localStorage.getItem('island_avatar'),
        nickname: nickname.trim(),
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
      setError(data.error ?? '保存失败')
      setSubmitting(false)
      return
    }
    router.push('/')
  }

  const selectCls =
    'h-12 w-full cursor-pointer appearance-none rounded-xl border border-[#e2ded4] bg-card px-3 text-sm text-ink outline-none focus:border-coral'

  return (
    <main className="shell bg-paper px-5 pb-10 pt-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl text-ink">填写资料</h1>
        <p className="mt-2 text-xs leading-5 text-ink-soft">
          登岛已经完成。填一次资料就能按契合认识人——昵称是岛上怎么叫你，岛民身份是玩出来的，不是名字。
        </p>
      </motion.div>

      <div className="mt-6 space-y-4 rounded-card bg-card p-5 shadow-sm">
        <div>
          <label className="mb-2 block text-xs font-medium text-ink-soft">昵称</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 12))}
            placeholder="岛上怎么称呼你"
            className={selectCls}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-ink-soft">性别（按异性匹配）</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { v: 'female', l: '女生' },
              { v: 'male', l: '男生' },
            ].map((g) => (
              <button
                key={g.v}
                type="button"
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

      <button
        type="button"
        onClick={() => setShowPrefs(!showPrefs)}
        className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-card bg-card px-5 py-4 text-sm shadow-sm"
      >
        <span className="text-ink">我的门槛偏好 <span className="text-xs text-ink-soft">（双向生效，默认宽进）</span></span>
        <ChevronDown size={18} className={`text-ink-soft transition-transform duration-200 ${showPrefs ? 'rotate-180' : ''}`} />
      </button>
      {showPrefs && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
          <div className="mt-2 space-y-4 rounded-card bg-card p-5 shadow-sm">
            <p className="text-xs text-[#a8a294]">默认比你小 5 岁到大 7 岁</p>
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
                    className={`h-11 cursor-pointer rounded-xl border text-sm ${
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

      <button
        onClick={submit}
        disabled={submitting}
        className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-coral text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,107,94,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? '保存中……' : '保存资料，去认识人'}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-soft">
        形象可以稍后在「我的 → 改形象」里换 · <Link href="/" className="underline">回首页</Link>
      </p>
    </main>
  )
}
