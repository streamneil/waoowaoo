'use client'

import { useEffect, useState } from 'react'

/**
 * A single, large film frame that cycles through three colour-graded "scenes",
 * each with a slate (Scene / Take). Pure CSS-driven, no media files.
 */
const SCENES = [
  {
    label: 'SCENE 01',
    take: 'TAKE 03',
    name: '夕阳·相遇',
    bg: 'linear-gradient(145deg, #FF6A3D 0%, #FFA77F 45%, #FFD3B7 100%)',
    accent: '#1A1A1F',
  },
  {
    label: 'SCENE 02',
    take: 'TAKE 01',
    name: '雨夜·追逐',
    bg: 'linear-gradient(145deg, #2F4A3F 0%, #4F6E5F 50%, #91A89B 100%)',
    accent: '#F5F1EA',
  },
  {
    label: 'SCENE 03',
    take: 'TAKE 07',
    name: '清晨·离别',
    bg: 'linear-gradient(145deg, #D6A02E 0%, #F5C660 45%, #FFE4D6 100%)',
    accent: '#1A1A1F',
  },
]

export default function HeroFilmFrame() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % SCENES.length)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  const scene = SCENES[idx]

  return (
    <div className="relative w-full max-w-md aspect-[3/4] mx-auto">
      {/* Outer film stock — black with perforations top & bottom */}
      <div className="absolute inset-0 rounded-[28px] bg-[#1A1A1F] shadow-[0_30px_60px_-20px_rgba(26,26,31,0.4),0_18px_36px_-12px_rgba(255,106,61,0.25)]">
        {/* Top perforation row */}
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-around px-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={`t-${i}`} className="w-3 h-3 rounded-[2px] bg-[#F5F1EA]/85" />
          ))}
        </div>
        {/* Bottom perforation row */}
        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-around px-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={`b-${i}`} className="w-3 h-3 rounded-[2px] bg-[#F5F1EA]/85" />
          ))}
        </div>

        {/* Inner frame — the "film" itself, transitions colour-grade across scenes */}
        <div
          className="absolute top-10 bottom-10 left-4 right-4 rounded-[18px] overflow-hidden transition-all duration-[1200ms] ease-out"
          style={{ background: scene.bg }}
        >
          {/* Subtle radial highlight to fake lens vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_30%,rgba(255,255,255,0.18),transparent_60%)]" />

          {/* Slate (top-left clapperboard label) */}
          <div
            className="absolute top-4 left-4 text-[10px] font-mono font-bold tracking-[0.2em] px-2 py-1 rounded-[4px] backdrop-blur-sm"
            style={{
              color: scene.accent,
              background:
                scene.accent === '#1A1A1F'
                  ? 'rgba(245,241,234,0.6)'
                  : 'rgba(26,26,31,0.5)',
            }}
          >
            {scene.label} · {scene.take}
          </div>

          {/* Center subject silhouette — abstract figure */}
          <div className="absolute inset-0 flex items-end justify-center pb-12">
            <div
              className="w-32 h-44 rounded-t-[80px] opacity-30"
              style={{ background: scene.accent }}
            />
          </div>

          {/* Scene name */}
          <div
            className="absolute bottom-4 left-4 right-4 text-2xl font-bold tracking-tight"
            style={{ color: scene.accent }}
          >
            {scene.name}
          </div>

          {/* Recording dot */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A3D] qy-aperture-pulse" />
            <span
              className="text-[9px] font-mono font-bold tracking-[0.18em]"
              style={{ color: scene.accent }}
            >
              REC
            </span>
          </div>
        </div>

        {/* Side mark — like a film roll edge code */}
        <div className="absolute left-0 right-0 top-8 h-2 flex items-center justify-center text-[8px] font-mono text-[#F5F1EA]/40 tracking-[0.4em]">
          QUYING · KODAK 5219 · 35MM
        </div>
      </div>

      {/* Scene index dots */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {SCENES.map((_, i) => (
          <span
            key={i}
            className="block h-1 rounded-full transition-all duration-500"
            style={{
              width: i === idx ? '24px' : '8px',
              background: i === idx ? '#FF6A3D' : 'rgba(26,26,31,0.18)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
