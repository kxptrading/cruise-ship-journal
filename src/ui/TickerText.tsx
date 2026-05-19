// ─────────────────────────────────────────────────────────────────────────────
// ui/TickerText.tsx — Seamless marquee ticker
//
// Measures actual text + container widths, then animates two copies side-by-side
// so the second enters from the right exactly as the first exits the left.
// Gap = max(MIN_GAP, containerWidth - textWidth) ensures no empty space for
// short names and a tidy breathing gap for long ones.
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
    setDims({ cw: outer.clientWidth, tw: measure.scrollWidth })
  }, [text])

  const base: CSSProperties = { display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0, ...style }
  const gap      = dims ? Math.max(MIN_GAP, dims.cw - dims.tw) : MIN_GAP
  const step     = dims ? dims.tw + gap : 0
  const duration = Math.max(2, step / 45)

  return (
    <div ref={outerRef} style={{ overflow: 'hidden', flex: 1 }}>
      {/* Hidden span for measuring rendered text width */}
      <span ref={measureRef} aria-hidden="true"
        style={{ ...base, position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}>
        {text}
      </span>

      {dims ? (
        <motion.div
          key={text}
          animate={{ x: [0, -step] }}
          transition={{ duration, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}
          style={{ display: 'flex', width: 'max-content' }}
        >
          <span style={{ ...base, paddingRight: gap }}>{text}</span>
          <span style={base} aria-hidden="true">{text}</span>
        </motion.div>
      ) : (
        <span style={base}>{text}</span>
      )}
    </div>
  )
}
