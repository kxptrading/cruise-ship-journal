// ─────────────────────────────────────────────────────────────────────────────
// components/JournalDock.tsx — macOS-style magnifying dock for the journal tabs
//
// The journal sections render as a dock of icons. On a pointer device, hovering
// magnifies the nearest icon (with the classic neighbour fall-off) via a single
// cursor-tracking motion value + a per-icon distance→size transform. Touch / mobile
// has no hover, so it's a plain scrollable icon row at base size. Active section
// shows a macOS-style dot and its label as a caption under the dock.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { WHITE, NAVY2, FONT_BODY } from '../constants'

interface DockTab<T extends string> { id: T; label: string; emoji: string }

interface Props<T extends string> {
  tabs:     DockTab<T>[]
  active:   T
  onSelect: (id: T) => void
  mobile:   boolean
}

export default function JournalDock<T extends string>({ tabs, active, onSelect, mobile }: Props<T>) {
  const mouseX = useMotionValue(Infinity)
  const activeLabel = tabs.find(t => t.id === active)?.label

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 20 }}>
      <motion.div
        onMouseMove={e => !mobile && mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        style={{
          display: 'flex', alignItems: 'flex-end', gap: mobile ? 6 : 10,
          padding: mobile ? '4px 0' : '6px 0',
          maxWidth: '100%',
          // No separate background — the icons sit straight on the page.
          // Mobile: scroll the row. Desktop: visible so icons can magnify upward.
          overflowX: mobile ? 'auto' : 'visible',
          overflowY: mobile ? 'hidden' : 'visible',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map(tab => (
          <DockIcon
            key={tab.id}
            mouseX={mouseX}
            emoji={tab.emoji}
            label={tab.label}
            active={tab.id === active}
            mobile={mobile}
            onSelect={() => onSelect(tab.id)}
          />
        ))}
      </motion.div>

      {/* Active section label — keeps orientation without always-on labels. */}
      {activeLabel && (
        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{activeLabel}</span>
      )}
    </div>
  )
}

function DockIcon({ mouseX, emoji, label, active, mobile, onSelect }: {
  mouseX: MotionValue<number>; emoji: string; label: string; active: boolean; mobile: boolean; onSelect: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = useState(false)

  const base    = mobile ? 38 : 46
  const maxScale = mobile ? 1 : 1.6   // no magnification on mobile (no hover)

  // Horizontal distance from cursor to this icon's centre → target SCALE.
  // We scale (a transform) rather than resize: transforms don't affect layout, so
  // the icon magnifies upward without expanding the row / shifting the page.
  const distance = useTransform(mouseX, (val) => {
    const b = ref.current?.getBoundingClientRect() ?? { x: 0, width: base }
    return val - b.x - b.width / 2
  })
  const scaleTarget = useTransform(distance, [-150, 0, 150], [1, maxScale, 1])
  const scale = useSpring(scaleTarget, { mass: 0.1, stiffness: 170, damping: 14 })

  return (
    <button
      ref={ref}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={label}
      title={label}
      style={{
        position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
        padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
      }}
    >
      {/* Tooltip on hover (desktop) */}
      {hovered && !mobile && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: NAVY2, color: WHITE, fontSize: 11, fontWeight: 600, fontFamily: FONT_BODY,
          padding: '4px 9px', borderRadius: 7, whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 20,
        }}>
          {label}
        </span>
      )}

      {/* Magnifying icon tile — fixed footprint, scaled visually from the bottom
          so it grows upward without resizing the row. */}
      <motion.div
        style={{
          width: base, height: base, flexShrink: 0,
          scale, transformOrigin: 'bottom center',
          zIndex: hovered ? 5 : 1,
          borderRadius: '24%',
          background: active ? 'rgba(201,162,39,0.16)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: Math.round(base * 0.54), lineHeight: 1 }}>{emoji}</span>
      </motion.div>

      {/* Active dot (macOS running indicator) */}
      <span style={{
        width: 4, height: 4, borderRadius: '50%', marginTop: 4,
        background: active ? 'var(--t-primary)' : 'transparent',
      }} />
    </button>
  )
}
