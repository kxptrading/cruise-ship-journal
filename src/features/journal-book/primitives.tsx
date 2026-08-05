// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/primitives.tsx — scrapbook decor building blocks
//
// Small presentational pieces recreated pixel-close from the design handoff
// (Resources/design_handoff_voyage_journal). All styling comes from tokens.ts;
// nothing here reaches into the app's global design system.
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'
import { BOOK, BOOK_FONT } from './tokens'
import type { WeatherChip as WeatherChipType } from './mapping'

// ── Polaroid ──────────────────────────────────────────────────────────────────
// White frame with a caption strip at the bottom. `photoH` sets the image height;
// the frame width comes from the parent (width style).
export function Polaroid({ url, caption, photoH, rotate = 0, style }: {
  url: string; caption?: string; photoH: number; rotate?: number; style?: CSSProperties
}) {
  return (
    <div style={{
      position: 'relative', background: BOOK.card, padding: '8px 8px 26px 8px',
      boxShadow: '0 6px 14px rgba(0,0,0,0.18)', transform: `rotate(${rotate}deg)`,
      ...style,
    }}>
      {url
        ? <img src={url} alt={caption || ''} style={{ display: 'block', width: '100%', height: photoH, objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: photoH, background: 'rgba(45,42,36,0.06)' }} />}
      {caption && (
        <div style={{
          position: 'absolute', bottom: 5, left: 0, right: 0, textAlign: 'center',
          fontFamily: BOOK_FONT.hand, fontSize: 12.5, color: BOOK.inkSoft, padding: '0 6px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{caption}</div>
      )}
    </div>
  )
}

// ── Washi tape ────────────────────────────────────────────────────────────────
export function WashiTape({ color, w = 68, h = 22, rotate = 0, style }: {
  color: string; w?: number; h?: number; rotate?: number; style?: CSSProperties
}) {
  return (
    <div aria-hidden style={{
      position: 'absolute', width: w, height: h, background: color,
      transform: `rotate(${rotate}deg)`, boxShadow: '0 2px 4px rgba(0,0,0,0.12)', ...style,
    }} />
  )
}

// ── Weather chip ──────────────────────────────────────────────────────────────
const CHIP_FILL: Record<WeatherChipType, string> = {
  SUNNY:  BOOK.mustard,
  CLOUDY: 'rgba(45,42,36,0.35)',
  RAINY:  BOOK.teal,
  STORMY: BOOK.ink,
}
export function WeatherChip({ value }: { value: WeatherChipType }) {
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 20, background: CHIP_FILL[value], color: '#fff',
      fontFamily: BOOK_FONT.body, fontWeight: 800, fontSize: 10.5, letterSpacing: 0.5,
    }}>{value}</span>
  )
}

// ── Mood dots (filled up to `value`, outline beyond) ──────────────────────────
export function MoodDots({ value }: { value: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: BOOK_FONT.body, fontSize: 11, color: BOOK.inkSoft, fontWeight: 700 }}>
      MOOD
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{
          width: 15, height: 15, borderRadius: '50%',
          background: i <= value ? BOOK.terracotta : 'transparent',
          border: i <= value ? 'none' : `2px solid ${BOOK.terracotta}`,
        }} />
      ))}
    </span>
  )
}

// ── Page-number stamp (dotted circle, "PAGE NN") ──────────────────────────────
export function PageStamp({ n }: { n: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: 18, right: 22, width: 50, height: 50, borderRadius: '50%',
      border: '2px dotted rgba(45,42,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: 'rotate(-10deg)', fontFamily: BOOK_FONT.hand, fontSize: 12, color: 'rgba(45,42,36,0.5)', textAlign: 'center',
    }}>PAGE&nbsp;{String(n).padStart(2, '0')}</div>
  )
}

// ── Shared page shell (paper + dot grain, fixed 576×864 coordinate box) ───────
export function PageShell({ children, padding = 36 }: { children: React.ReactNode; padding?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: BOOK.paper,
      backgroundImage: BOOK.grain, backgroundSize: BOOK.grainSize,
      fontFamily: BOOK_FONT.body, overflow: 'hidden', padding, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>{children}</div>
  )
}
