// ─────────────────────────────────────────────────────────────────────────────
// components/ui/empty-state.tsx — Empty data placeholder
//
// Usage:
//   <EmptyState
//     icon="📝"
//     heading="No notes yet"
//     body="Start capturing your cruise memories."
//     action={{ label: 'Add a note', onClick: handleAdd }}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { FONT_DISPLAY, FONT_BODY, MUTED } from '../../constants'
import { Button } from './button'

export interface EmptyStateAction {
  label:   string
  onClick: () => void
}

export interface EmptyStateProps {
  icon?:    string
  heading:  string
  body?:    string
  action?:  EmptyStateAction
  style?:   CSSProperties
}

export function EmptyState({ icon, heading, body, action, style }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        textAlign:      'center',
        padding:        '48px 24px',
        ...style,
      }}
    >
      {icon && (
        <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>
          {icon}
        </div>
      )}
      <h3 style={{
        margin:      0,
        marginBottom: body ? 8 : action ? 20 : 0,
        fontSize:    20,
        fontWeight:  400,
        color:       'var(--t-primary-dk)',
        fontFamily:  FONT_DISPLAY,
      }}>
        {heading}
      </h3>
      {body && (
        <p style={{
          margin:      '0 0 20px',
          fontSize:    14,
          color:       MUTED,
          lineHeight:  1.6,
          maxWidth:    320,
          fontFamily:  FONT_BODY,
        }}>
          {body}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}
