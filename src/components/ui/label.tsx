// ─────────────────────────────────────────────────────────────────────────────
// components/ui/label.tsx — Uppercase field label
//
// Usage:
//   <Label>Ship Name</Label>
//   <Label htmlFor="ship-input">Ship Name</Label>
// ─────────────────────────────────────────────────────────────────────────────

import type { LabelHTMLAttributes, ReactNode } from 'react'
import { MUTED, FONT_BODY } from '../../constants'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
}

export function Label({ children, style, ...rest }: LabelProps) {
  return (
    <label
      style={{
        display:       'block',
        fontSize:      11,
        fontWeight:    700,
        color:         MUTED,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  6,
        fontFamily:    FONT_BODY,
        ...style,
      }}
      {...rest}
    >
      {children}
    </label>
  )
}
