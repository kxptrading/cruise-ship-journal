// ─────────────────────────────────────────────────────────────────────────────
// components/ui/input.tsx — Input, Textarea, and Select primitives
//
// Usage:
//   <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ship name" />
//   <Input value={x} onChange={e => …} error="Required" />
//   <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
//   <Select value={meal} onChange={e => setMeal(e.target.value)}>
//     <option value="breakfast">Breakfast</option>
//   </Select>
// ─────────────────────────────────────────────────────────────────────────────

import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { BORDER, WHITE, TEXT, FONT_BODY, GOLD, MUTED } from '../../constants'

const BASE: CSSProperties = {
  width:      '100%',
  border:     `1px solid ${BORDER}`,
  borderRadius: 10,
  padding:    '10px 14px',
  fontSize:   15,
  fontFamily: FONT_BODY,
  boxSizing:  'border-box',
  background: WHITE,
  color:      TEXT,
  outline:    'none',
  transition: 'border-color 0.15s ease',
}

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement
    el.style.borderColor = GOLD
    el.style.boxShadow   = `0 0 0 2px ${GOLD}33`
  },
  onBlur: (e: React.FocusEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement
    el.style.borderColor = BORDER
    el.style.boxShadow   = 'none'
  },
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function Input({ error, style, onFocus, onBlur, ...rest }: InputProps) {
  return (
    <div>
      <input
        style={{ ...BASE, borderColor: error ? '#F97316' : BORDER, ...style }}
        onFocus={e => { focusHandlers.onFocus(e); onFocus?.(e) }}
        onBlur={e  => { focusHandlers.onBlur(e);  onBlur?.(e)  }}
        {...rest}
      />
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#F97316', fontFamily: FONT_BODY }}>{error}</p>}
    </div>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export function Textarea({ error, style, onFocus, onBlur, rows = 4, ...rest }: TextareaProps) {
  return (
    <div>
      <textarea
        rows={rows}
        style={{ ...BASE, resize: 'vertical', lineHeight: 1.65, borderColor: error ? '#F97316' : BORDER, ...style }}
        onFocus={e => { focusHandlers.onFocus(e); onFocus?.(e) }}
        onBlur={e  => { focusHandlers.onBlur(e);  onBlur?.(e)  }}
        {...rest}
      />
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#F97316', fontFamily: FONT_BODY }}>{error}</p>}
    </div>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
  error?:   string
}

export function Select({ children, error, style, onFocus, onBlur, ...rest }: SelectProps) {
  return (
    <div>
      <select
        style={{ ...BASE, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36, borderColor: error ? '#F97316' : BORDER, ...style }}
        onFocus={e => { focusHandlers.onFocus(e); onFocus?.(e) }}
        onBlur={e  => { focusHandlers.onBlur(e);  onBlur?.(e)  }}
        {...rest}
      >
        {children}
      </select>
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#F97316', fontFamily: FONT_BODY }}>{error}</p>}
    </div>
  )
}
