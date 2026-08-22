'use client'

import { motion, useReducedMotion } from 'framer-motion'

// 治愈系场景氛围层：每幕一组环境动画，全部 pointer-events-none
// useReducedMotion 时渲染静态版本

interface FXProps {
  code: string
}

export default function SceneFX({ code }: FXProps) {
  const reduced = useReducedMotion()
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* 通用：漂浮光尘 */}
      <Particles reduced={reduced} />
      {code === 'luggage' && <BoatSea reduced={reduced} />}
      {code === 'fog' && <FogForest reduced={reduced} />}
      {code === 'crush' && <Lanterns reduced={reduced} />}
      {code === 'storm' && <RainStorm reduced={reduced} />}
      {code === 'leave' && <SunsetShip reduced={reduced} />}
    </div>
  )
}

/* —— 通用：光尘粒子 —— */
function Particles({ reduced }: { reduced: boolean | null }) {
  const dots = [
    { l: '8%', t: '18%', d: 0, s: 3, dur: 7 },
    { l: '22%', t: '62%', d: 1.2, s: 2, dur: 9 },
    { l: '35%', t: '30%', d: 2.4, s: 2.5, dur: 8 },
    { l: '52%', t: '74%', d: 0.6, s: 2, dur: 10 },
    { l: '68%', t: '22%', d: 1.8, s: 3, dur: 7.5 },
    { l: '80%', t: '56%', d: 0.3, s: 2, dur: 9.5 },
    { l: '91%', t: '36%', d: 2.1, s: 2.5, dur: 8.5 },
    { l: '15%', t: '85%', d: 1.5, s: 2, dur: 11 },
  ]
  return (
    <>
      {dots.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/40 blur-[1px]"
          style={{ left: p.l, top: p.t, width: p.s, height: p.s }}
          animate={reduced ? undefined : { y: [0, -14, 0], opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.d, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}

/* —— 第一幕 行李：夜海、月亮、小船随浪摇 —— */
function BoatSea({ reduced }: { reduced: boolean | null }) {
  return (
    <>
      <motion.div
        className="absolute right-[12%] top-[10%] h-16 w-16 rounded-full bg-[#ffe9b8]/90 blur-[2px]"
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ boxShadow: '0 0 60px 24px rgba(255,233,184,0.25)' }}
      />
      {/* 小船 */}
      <motion.div
        className="absolute bottom-[19%] left-[10%]"
        animate={reduced ? undefined : { y: [0, -7, 0], rotate: [-2.5, 2, -2.5] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="86" height="64" viewBox="0 0 86 64">
          <path d="M6 46 L74 46 L64 60 L16 60 Z" fill="rgba(255,255,255,0.85)" />
          <rect x="41" y="8" width="2.5" height="38" fill="rgba(255,255,255,0.7)" />
          <path d="M44 12 C58 20 60 32 44 40 Z" fill="rgba(255,255,255,0.55)" />
          <path d="M40 16 C30 22 29 32 40 38 Z" fill="rgba(255,255,255,0.4)" />
        </svg>
      </motion.div>
      {/* 海浪 */}
      {[0, 1].map((i) => (
        <motion.svg
          key={i}
          className="absolute bottom-0 left-0 w-[200%]"
          style={{ bottom: i === 0 ? '-4px' : '-10px', opacity: i === 0 ? 0.22 : 0.14 }}
          viewBox="0 0 800 60"
          preserveAspectRatio="none"
          animate={reduced ? undefined : { x: i === 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
          transition={{ duration: i === 0 ? 9 : 13, repeat: Infinity, ease: 'linear' }}
        >
          <path d="M0 30 Q50 10 100 30 T200 30 T300 30 T400 30 T500 30 T600 30 T700 30 T800 30 V60 H0 Z" fill="#7fd4d0" />
        </motion.svg>
      ))}
    </>
  )
}

/* —— 第二幕 迷雾：林影与流动的雾带 —— */
function FogForest({ reduced }: { reduced: boolean | null }) {
  const wisps = [
    { top: '24%', w: 340, h: 90, o: 0.16, dur: 14, x: ['-30%', '110%'] },
    { top: '42%', w: 420, h: 110, o: 0.12, dur: 19, x: ['110%', '-40%'] },
    { top: '58%', w: 300, h: 80, o: 0.18, dur: 12, x: ['-20%', '115%'] },
    { top: '72%', w: 460, h: 100, o: 0.1, dur: 22, x: ['115%', '-30%'] },
  ]
  return (
    <>
      {/* 树影 */}
      <svg className="absolute bottom-0 left-0 w-full opacity-25" viewBox="0 0 400 120" preserveAspectRatio="none">
        {[20, 60, 105, 150, 200, 250, 300, 345, 385].map((x, i) => (
          <path key={x} d={`M${x} 120 L${x} ${64 - (i % 3) * 14} M${x} ${78 - (i % 3) * 10} L${x - 14} ${92 - (i % 3) * 10} M${x} ${70 - (i % 3) * 12} L${x + 14} ${86 - (i % 3) * 12}`} stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
        ))}
      </svg>
      {/* 流动雾带 */}
      {wisps.map((w, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white blur-2xl"
          style={{ top: w.top, width: w.w, height: w.h, opacity: w.o }}
          animate={reduced ? undefined : { x: w.x as string[] }}
          transition={{ duration: w.dur, repeat: Infinity, ease: 'linear', repeatType: 'mirror' }}
        />
      ))}
    </>
  )
}

/* —— 第三幕 心动：暖色黄昏、缓缓升起的灯 —— */
function Lanterns({ reduced }: { reduced: boolean | null }) {
  const lanterns = [
    { l: '12%', d: 0, dur: 16, s: 7 },
    { l: '30%', d: 3, dur: 20, s: 5 },
    { l: '52%', d: 1.5, dur: 14, s: 6 },
    { l: '70%', d: 5, dur: 22, s: 4.5 },
    { l: '86%', d: 2, dur: 18, s: 5.5 },
  ]
  return (
    <>
      {lanterns.map((l, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: l.l, bottom: '-4%' }}
          animate={
            reduced
              ? { y: '-90vh' }
              : { y: '-105vh', x: [0, 14, -10, 12, 0] }
          }
          transition={
            reduced
              ? { duration: 0 }
              : { y: { duration: l.dur, repeat: Infinity, delay: l.d, ease: 'linear' }, x: { duration: 9, repeat: Infinity, ease: 'easeInOut' } }
          }
        >
          <div
            className="rounded-full bg-[#ffce7a]"
            style={{ width: l.s, height: l.s * 1.35, boxShadow: `0 0 ${l.s * 3}px ${l.s}px rgba(255,190,110,0.4)` }}
          />
        </motion.div>
      ))}
      {/* 集市摊位剪影 */}
      <svg className="absolute bottom-0 w-full opacity-20" viewBox="0 0 400 70" preserveAspectRatio="none">
        <path d="M20 70 V40 Q45 28 70 40 V70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" />
        <path d="M120 70 V34 Q150 20 180 34 V70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" />
        <path d="M240 70 V44 Q268 32 296 44 V70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" />
        <path d="M330 70 V30 Q360 16 392 30 V70" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" />
      </svg>
    </>
  )
}

/* —— 第四幕 风暴：斜雨、云、远处灯塔的光 —— */
function RainStorm({ reduced }: { reduced: boolean | null }) {
  const drops = Array.from({ length: 26 }, (_, i) => ({
    l: (i * 37) % 100,
    d: (i % 7) * 0.18,
    dur: 0.9 + (i % 5) * 0.14,
    len: 14 + (i % 4) * 6,
  }))
  return (
    <>
      {/* 乌云 */}
      <motion.div
        className="absolute -top-10 left-[10%] h-28 w-72 rounded-full bg-[#22344c] blur-xl"
        animate={reduced ? undefined : { x: [0, 24, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-6 right-[8%] h-24 w-60 rounded-full bg-[#1c2c42] blur-xl"
        animate={reduced ? undefined : { x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* 斜雨 */}
      {drops.map((d, i) => (
        <motion.span
          key={i}
          className="absolute top-[-6%] rounded-full bg-white/35"
          style={{ left: `${d.l}%`, width: 1.5, height: d.len, rotate: 14 }}
          animate={reduced ? undefined : { y: '112vh', x: 26 }}
          transition={{ duration: d.dur, repeat: Infinity, delay: d.d, ease: 'linear' }}
        />
      ))}
      {/* 灯塔光：风暴里恒定的那一点 */}
      <motion.div
        className="absolute bottom-[24%] right-[14%] h-2.5 w-2.5 rounded-full bg-[#ffd989]"
        style={{ boxShadow: '0 0 24px 10px rgba(255,217,137,0.45)' }}
        animate={reduced ? undefined : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  )
}

/* —— 第五幕 去留：落日、归船、灯塔扫过的光 —— */
function SunsetShip({ reduced }: { reduced: boolean | null }) {
  return (
    <>
      {/* 落日 */}
      <motion.div
        className="absolute bottom-[26%] left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[#ff9d6f]"
        style={{ boxShadow: '0 0 90px 40px rgba(255,157,111,0.3)' }}
        animate={reduced ? undefined : { y: [0, 16, 0], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* 海平线 */}
      <div className="absolute bottom-[24%] h-px w-full bg-white/25" />
      {/* 归船剪影 */}
      <motion.div
        className="absolute bottom-[17%] left-[16%]"
        animate={reduced ? undefined : { x: [0, 34, 0], y: [0, -3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="90" height="46" viewBox="0 0 90 46" className="opacity-80">
          <path d="M6 30 L82 30 L70 44 L18 44 Z" fill="#0e1420" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <rect x="44" y="4" width="2" height="26" fill="rgba(255,255,255,0.6)" />
          <path d="M47 8 C62 16 62 24 47 28 Z" fill="rgba(255,255,255,0.35)" />
        </svg>
      </motion.div>
      {/* 灯塔扫光 */}
      <motion.div
        className="absolute right-[6%] top-[12%] h-[70%] w-40 origin-top"
        style={{
          background: 'conic-gradient(from 160deg at 100% 0%, transparent 0deg, rgba(255,233,184,0.14) 12deg, transparent 26deg)',
        }}
        animate={reduced ? undefined : { rotate: [-16, 10, -16] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  )
}
