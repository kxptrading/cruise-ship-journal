// ─────────────────────────────────────────────────────────────────────────────
// ui/TickerText.tsx — Seamless marquee ticker
//
// SEAMLESS LOOP:
//   Two copies side-by-side in a flex row.
//   The wrapper animates x: [0, -step] where step = textWidth + gap.
//   When copy 1 exits left, copy 2 is exactly where copy 1 started.
//   Framer Motion's repeatType:'loop' resets x instantly — because copy 1
//   and copy 2 are the same text at the same position, the reset is invisible.
//
// GAP CALCULATION:
//   gap = max(MIN_GAP, containerWidth - textWidth)
//   Short text → gap fills the remaining container so copy 2 is always at
//   the right edge when copy 1 exits: text is always present in the viewport.
//   Long text  → gap = MIN_GAP (32 px breathing room between rotations).
//
// LIVE RESIZE (orientation changes):
//   A ResizeObserver re-measures containerWidth whenever the element resizes.
//   The animation key includes `step` so it restarts cleanly from x=0
//   after a rotation rather than continuing with stale measurements.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'

const MIN_GAP = 32

interface Props {
  text:   string
  style?: CSSProperties
}

export default function TickerText({ text, style }: Props) {
  const outerRef   = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [dims, setDims] = useState<{ cw: number; tw: number } | null>(null)

  useEffect(() => {
    const outer   = outerRef.current
    const measure = measureRef.current
    if (!outer || !measure) return

    const update = () => {
      const cw = outer.clientWidth
      const tw = measure.scrollWidth
      if (cw > 0 && tw > 0) setDims({ cw, tw })
    }

    update() // initial measurement

    // Re-measure on any resize — covers orientation changes, sidebar open/close,
    // window resizing. Without this, dims are stale after rotation and the gap
    // is wrong, making copy 2 appear mid-screen instead of at the right edge.
    const ro = new ResizeObserver(update)
    ro.observe(outer)
    return () => ro.disconnect()
  }, [text])

  const base: CSSProperties = {
    display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0, ...style,
  }

  const gap      = dims ? Math.max(MIN_GAP, dims.cw - dims.tw) : MIN_GAP
  const step     = dims ? dims.tw + gap : 0
  // Steady ~45 px/s so short and long names feel the same pace
  const duration = Math.max(2, step / 45)

  return (
    <div ref={outerRef} style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
      {/* Hidden span — measures the actual rendered pixel width of the text.
          aria-hidden prevents screen readers doubling the content. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{ ...base, position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      >
        {text}
      </span>

      {dims && step > 0 ? (
        // key includes step so the animation restarts from x=0 after a
        // resize/rotation rather than continuing with the old measurements.
        <motion.div
          key={`${text}-${step}`}
          animate={{ x: [0, -step] }}
          transition={{ duration, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}
          style={{ display: 'flex', width: 'max-content' }}
        >
          {/* copy 1 — paddingRight creates the gap before copy 2 */}
          <span style={{ ...base, paddingRight: gap }}>{text}</span>
          {/* copy 2 — enters right edge exactly as copy 1 exits left edge */}
          <span style={base} aria-hidden="true">{text}</span>
        </motion.div>
      ) : (
        // Static fallback until first measurement completes
        <span style={base}>{text}</span>
      )}
    </div>
  )
}
