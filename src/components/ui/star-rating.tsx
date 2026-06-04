// ─────────────────────────────────────────────────────────────────────────────
// components/ui/star-rating.tsx — Interactive + read-only star rating
//
// Usage (interactive):
//   <StarRating value={3} onChange={setRating} />
//
// Usage (read-only display):
//   <StarRating value={4} readonly />
//   <StarRating value={4.5} readonly size={16} />  — fractional supported read-only
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GOLD, BORDER } from '../../constants'

export interface StarRatingProps {
  value:     number
  onChange?: (n: number) => void
  size?:     number
  readonly?: boolean
}

export function StarRating({ value, onChange, size = 22, readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const [animating, setAnimating] = useState<number | null>(null)

  const display = readonly ? value : (hovered || value)

  const handleClick = (n: number) => {
    if (readonly || !onChange) return
    onChange(n)
    setAnimating(n)
    setTimeout(() => setAnimating(null), 380)
  }

  return (
    <div
      style={{ display: 'inline-flex', gap: size < 20 ? 2 : 4 }}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map(n => {
        // Fractional fill for read-only display
        const fill = readonly
          ? Math.min(1, Math.max(0, display - (n - 1)))
          : n <= display ? 1 : 0

        const isFull  = fill >= 1
        const isEmpty = fill === 0
        const color   = isFull ? GOLD : isEmpty ? BORDER : GOLD

        return (
          <motion.button
            key={n}
            onClick={() => handleClick(n)}
            onMouseEnter={() => !readonly && setHovered(n)}
            animate={animating === n ? { scale: [1, 1.55, 0.95, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
            style={{
              background:   'none',
              border:       'none',
              cursor:       readonly ? 'default' : 'pointer',
              fontSize:     size,
              color,
              padding:      0,
              lineHeight:   1,
              display:      'inline-flex',
              userSelect:   'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {readonly && !isFull && !isEmpty
              ? <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span style={{ color: BORDER }}>★</span>
                  <span style={{
                    position: 'absolute', left: 0, top: 0,
                    width: `${fill * 100}%`, overflow: 'hidden', color: GOLD,
                  }}>★</span>
                </span>
              : '★'
            }
          </motion.button>
        )
      })}
    </div>
  )
}
