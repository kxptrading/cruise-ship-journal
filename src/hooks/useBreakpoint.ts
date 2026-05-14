// ─────────────────────────────────────────────────────────────────────────────
// hooks/useBreakpoint.ts — Responsive breakpoint hook
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

function classify(w: number): Breakpoint {
  if (w < 768)  return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => classify(window.innerWidth))
  useEffect(() => {
    const handler = () => setBp(classify(window.innerWidth))
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return bp
}
