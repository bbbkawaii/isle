'use client'

import { useEffect, useRef, useState } from 'react'

// 打字机文案：LLM 画像/叙事的呈现方式；reduced-motion 时直接全量显示
export default function Typewriter({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState('')
  const [reduced, setReduced] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    if (mq.matches) {
      setShown(text)
      return
    }
    let i = 0
    timer.current = setInterval(() => {
      i += 2
      setShown(text.slice(0, i))
      if (i >= text.length && timer.current) clearInterval(timer.current)
    }, 45)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [text])

  return (
    <p className={className}>
      {reduced ? text : shown}
      {shown.length < text.length && <span className="animate-pulse">▍</span>}
    </p>
  )
}
