'use client'

import { LampDesk, Flame, Leaf, BookOpen, Apple, Mountain, Store } from 'lucide-react'

const MAP = {
  lighthouse: LampDesk,
  bonfire: Flame,
  valley: Leaf,
  cave: BookOpen,
  orchard: Apple,
  cliff: Mountain,
  market: Store,
} as const

export default function IdentityIcon({ code, size = 24 }: { code: string; size?: number }) {
  const Icon = MAP[code as keyof typeof MAP] ?? Store
  return <Icon size={size} strokeWidth={1.8} />
}
