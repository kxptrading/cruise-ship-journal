// ─────────────────────────────────────────────────────────────────────────────
// components/ui/card.tsx — Card primitives
//
// Usage:
//   <Card variant="elevated">
//     <CardHeader title="Ports Visited" action={<Button size="sm">Add</Button>} />
//     <CardBody>content here</CardBody>
//     <CardFooter>footer actions</CardFooter>
//   </Card>
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BORDER, WHITE, TEXT, MUTED } from '../../constants'

export type CardVariant = 'flat' | 'elevated' | 'glass'

export interface CardProps {
  variant?:  CardVariant
  children:  ReactNode
  className?: string
  style?:    CSSProperties
  onClick?:  () => void
}

const BASE: CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  overflow: 'hidden',
}

const VARIANT_STYLES: Record<CardVariant, CSSProperties> = {
  flat: {
    background: WHITE,
  },
  elevated: {
    background: WHITE,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  glass: {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.35)',
  },
}

export function Card({ variant = 'flat', children, className, style, onClick }: CardProps) {
  const isElevated = variant === 'elevated'

  return (
    <motion.div
      whileHover={isElevated ? { y: -2, boxShadow: '0 6px 24px rgba(0,0,0,0.1)' } : undefined}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className={className}
      style={{
        ...BASE,
        ...VARIANT_STYLES[variant],
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

export interface CardHeaderProps {
  title:   string
  sub?:    string
  action?: ReactNode
  style?:  CSSProperties
}

export function CardHeader({ title, sub, action, style }: CardHeaderProps) {
  return (
    <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, ...style }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: '-0.01em' }}>{title}</h3>
        {sub && <p style={{ margin: '3px 0 0', fontSize: 13, color: MUTED }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

export interface CardBodyProps {
  children: ReactNode
  style?:   CSSProperties
  padded?:  boolean
}

export function CardBody({ children, style, padded = true }: CardBodyProps) {
  return (
    <div style={{ padding: padded ? '16px 20px' : 0, ...style }}>
      {children}
    </div>
  )
}

export interface CardFooterProps {
  children: ReactNode
  style?:   CSSProperties
}

export function CardFooter({ children, style }: CardFooterProps) {
  return (
    <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      {children}
    </div>
  )
}
