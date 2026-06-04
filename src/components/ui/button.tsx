// ─────────────────────────────────────────────────────────────────────────────
// components/ui/button.tsx — Themed button primitives
//
// Usage:
//   <Button>Save</Button>
//   <Button variant="secondary" size="sm">Cancel</Button>
//   <Button variant="ghost">View all</Button>
//   <Button variant="destructive" onClick={handleDelete}>Delete</Button>
//   <Button disabled>Loading…</Button>
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { WHITE, FONT_BODY } from '../../constants'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize    = 'sm' | 'md' | 'lg'

// Omit animation events that conflict with Framer Motion's own handlers
type SafeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragEnd' | 'onDragStart'
>

export interface ButtonProps extends SafeButtonProps {
  variant?:  ButtonVariant
  size?:     ButtonSize
  children:  ReactNode
}

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--t-primary)',
    color: WHITE,
    border: 'none',
  },
  secondary: {
    background: WHITE,
    color: 'var(--t-primary)',
    border: '1.5px solid var(--t-primary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--t-primary)',
    border: 'none',
  },
  destructive: {
    background: '#F97316',
    color: WHITE,
    border: 'none',
  },
}

const SIZE_STYLE: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: 13, borderRadius: 8 },
  md: { padding: '10px 20px', fontSize: 14, borderRadius: 10 },
  lg: { padding: '13px 28px', fontSize: 15, borderRadius: 12 },
}

const BASE: CSSProperties = {
  fontFamily:   FONT_BODY,
  fontWeight:   600,
  cursor:       'pointer',
  display:      'inline-flex',
  alignItems:   'center',
  justifyContent: 'center',
  gap:          6,
  letterSpacing: '0.01em',
  transition:   'filter 0.15s ease, opacity 0.15s ease',
  userSelect:   'none',
  WebkitTapHighlightColor: 'transparent',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, style, disabled, ...rest }, ref) => (
    <motion.button
      ref={ref}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled}
      style={{
        ...BASE,
        ...VARIANT_STYLE[variant],
        ...SIZE_STYLE[size],
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
      {...rest}
    >
      {children}
    </motion.button>
  )
)
Button.displayName = 'Button'
