'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import IdentityIcon from '@/components/IdentityIcon'
import Typewriter from '@/components/Typewriter'

interface Props {
  identity: { code: string; name: string; icon: string; core: string; tags: string[]; routine: string }
  loveProfile: string
  preview: string
  slowest: { title: string; seconds: number }
}

export default function ReportView({ identity, loveProfile, preview, slowest }: Props) {
  return (
    <main className="shell bg-paper pb-10">
      {/* 顶部身份揭晓 */}
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-b from-night to-[#1c3050] px-6 pb-10 pt-12 text-center text-white">
        <motion.p
          className="text-[11px] tracking-[0.35em] text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          你的岛屿人格报告
        </motion.p>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.25 }}
          className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-coral shadow-[0_10px_40px_rgba(255,107,94,0.45)]"
        >
          <IdentityIcon code={identity.code} size={36} />
        </motion.div>
        <motion.h1
          className="font-display mt-5 text-4xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          {identity.name}
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-white/65"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {identity.core}
        </motion.p>
      </div>

      <div className="space-y-4 px-5 pt-6">
        {/* 恋爱画像 */}
        <motion.section
          className="rounded-card bg-card p-5 shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <p className="mb-3 text-xs font-medium text-ink-soft">恋爱画像</p>
          <Typewriter text={loveProfile} className="min-h-[7rem] text-[15px] leading-8 text-ink" />
          <div className="mt-4 flex flex-wrap gap-2">
            {identity.tags.map((t, i) => (
              <motion.span
                key={t}
                className="rounded-full bg-coral/10 px-3 py-1 text-xs text-coral-deep"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + i * 0.12 }}
              >
                {t}
              </motion.span>
            ))}
          </div>
        </motion.section>

        {/* 彩蛋：犹豫最久的一幕 */}
        <motion.section
          className="rounded-card border border-dashed border-[#d8d2c6] p-4 text-xs leading-6 text-ink-soft"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          小数据 · 你在「{slowest.title}」停留了最久（{slowest.seconds} 秒）。犹豫的地方，往往才是真正在意的地方。
        </motion.section>

        {/* 你会遇见谁（钩子） */}
        <motion.section
          className="rounded-card bg-gradient-to-br from-[#14263a] to-[#1d4a5f] p-5 text-white shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45 }}
        >
          <p className="text-xs tracking-[0.25em] text-white/50">你会在岛上遇见谁</p>
          <p className="font-display mt-3 text-[15px] leading-8 text-white/90">{preview}</p>
          <p className="mt-3 text-xs text-white/45">完成登岛登记，解锁具体候选人与契合解读</p>
        </motion.section>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="space-y-3">
          <Link
            href="/register"
            className="flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-coral text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,107,94,0.35)] transition-transform active:scale-[0.98]"
          >
            办理登岛证 · 解锁配对
          </Link>
          <Link href="/" className="block text-center text-xs text-ink-soft underline">
            先不登记，回首页逛逛
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
