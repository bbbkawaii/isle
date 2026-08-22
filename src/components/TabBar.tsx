'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Gamepad2, User } from 'lucide-react'

const TABS = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/games', icon: Gamepad2, label: '游戏' },
  { href: '/profile', icon: User, label: '我的' },
]

// 悬浮胶囊底栏：暖白毛玻璃 + 大圆角 + 柔和投影
export default function TabBar() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-[398px] rounded-full border border-white/60 bg-[rgba(255,253,249,0.88)] shadow-[0_8px_30px_rgba(80,60,40,0.16)] backdrop-blur-xl"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch p-1.5">
        {TABS.map((t) => {
          const active = pathname === t.href
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-full py-2 transition-all duration-200 ${
                active ? 'bg-gradient-to-b from-[#ff8a70] to-[#f4553f] text-white shadow-[0_6px_16px_rgba(244,85,63,0.35)]' : 'text-ink-soft'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
              <span className={`text-[10px] ${active ? 'font-semibold' : ''}`}>{t.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
