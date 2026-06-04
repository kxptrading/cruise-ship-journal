// ─────────────────────────────────────────────────────────────────────────────
// components/ui/skeleton.tsx — Shimmer placeholder loader
//
// Usage:
//   <Skeleton height={20} width="60%" />                   — text line
//   <Skeleton height={148} className="rounded-[14px]" />   — card placeholder
//   <Skeleton circle size={40} />                          — avatar placeholder
//
//   // Stacked skeleton "card":
//   <div style={{ padding: 20 }}>
//     <Skeleton height={20} width="45%" style={{ marginBottom: 12 }} />
//     <Skeleton height={14} style={{ marginBottom: 8 }} />
//     <Skeleton height={14} width="80%" />
//   </div>
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'

export interface SkeletonProps {
  width?:    string | number
  height?:   string | number
  circle?:   boolean
  size?:     number          // shorthand for circle: width=height=size
  className?: string
  style?:    CSSProperties
}

export function Skeleton({ width, height, circle, size, className, style }: SkeletonProps) {
  const w = circle && size ? size : width
  const h = circle && size ? size : height

  return (
    <div
      className={`skeleton-shimmer${className ? ` ${className}` : ''}`}
      style={{
        width:        w,
        height:       h,
        borderRadius: circle ? '50%' : 6,
        display:      'block',
        ...style,
      }}
    />
  )
}

// ── SkeletonCard — full card placeholder ──────────────────────────────────────

export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Skeleton circle size={36} />
        <div style={{ flex: 1 }}>
          <Skeleton height={13} width="40%" style={{ marginBottom: 6 }} />
          <Skeleton height={11} width="25%" />
        </div>
      </div>
      <Skeleton height={14} style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="85%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="65%" />
    </div>
  )
}
