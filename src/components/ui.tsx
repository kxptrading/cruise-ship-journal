// ─────────────────────────────────────────────────────────────────────────────
// components/ui.tsx — Shared primitive UI components
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { NAVY2, GOLD, BORDER, MUTED, LIGHT, WHITE, CREAM, FONT_DISPLAY, FONT_BODY } from '../constants'
import { sty } from '../constants'
import { BP } from '../constants'
import { useW } from '../context'

interface LblProps    { c: ReactNode }
interface InpProps    { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: CSSProperties }
interface TAProps     { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }
interface FldProps    { label: string; children: ReactNode; half?: boolean }
interface Row2Props   { children: ReactNode }
interface BoxProps    { title: string; children: ReactNode; color?: string; emoji?: string }
interface StarsProps  { value: number; onChange: (n: number) => void }
interface PgHdrProps  { title: string; sub?: string; icon?: ReactNode }
interface SvgProps    { d: string; size?: number; color?: string; weight?: number }
interface DonutProps  { pct?: number; size?: number; color?: string; bg?: string; thick?: number }
interface MetricProps { icon: string; value: string | number; label: string; sub?: string; color: string; pct?: number; ring?: number; alert?: boolean }
interface ToastProps  { message: string; visible: boolean }

export const Lbl = ({ c }: LblProps) => <label style={sty.lbl}>{c}</label>

export const Inp = ({ value, onChange, placeholder, type = 'text', style = {} }: InpProps) => (
  <input
    type={type}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{ ...sty.inp, ...style }}
  />
)

export const TA = ({ value, onChange, placeholder, rows = 4 }: TAProps) => (
  <textarea
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{ ...sty.inp, resize: 'vertical', lineHeight: 1.7 }}
  />
)

export const Fld = ({ label, children, half }: FldProps) => (
  <div style={{ marginBottom: 16, flex: half ? '1' : undefined }}>
    <Lbl c={label} />
    {children}
  </div>
)

export const Row2 = ({ children }: Row2Props) => {
  const w = useW()
  return (
    <div style={{ display: 'flex', flexDirection: w < BP.mobile ? 'column' : 'row', gap: 16 }}>
      {children}
    </div>
  )
}

export const Box = ({ title, children, color, emoji }: BoxProps) => (
  <div style={{ borderRadius: 12, marginBottom: 20, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
    <div style={{ background: color || NAVY2, color: WHITE, padding: '8px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', borderRadius: '12px 12px 0 0', fontFamily: FONT_BODY }}>
      {emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}{title}
    </div>
    <div style={{ padding: 16, background: LIGHT }}>{children}</div>
  </div>
)

export const Stars = ({ value, onChange }: StarsProps) => {
  const [pulse, setPulse] = useState<number | null>(null)
  const click = (n: number) => {
    onChange(n)
    setPulse(n)
    setTimeout(() => setPulse(null), 300)
  }
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => click(n)}
          className={pulse === n ? 'star-pulse' : ''}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: n <= value ? GOLD : BORDER, padding: 0, lineHeight: 1, display: 'inline-block' }}>
          ★
        </button>
      ))}
    </div>
  )
}

export const PgHdr = ({ title, sub, icon }: PgHdrProps) => {
  const w = useW()
  const h1Size = w < BP.mobile ? 30 : 36
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: CREAM, paddingTop: 12, paddingBottom: 4, marginBottom: 20, boxShadow: '0 4px 16px rgba(248,249,250,0.95)' }}>
      <h1 style={{ margin: 0, fontSize: h1Size, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
        {icon && <span style={{ marginRight: 10 }}>{icon}</span>}{title}
      </h1>
      {sub && <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 14, fontFamily: FONT_BODY, fontWeight: 600 }}>{sub}</p>}
      <div style={{ height: 4, background: GOLD, width: 56, marginTop: 10, borderRadius: 2 }} />
    </div>
  )
}

export const SvgIcon = ({ d, size = 18, color = 'currentColor', weight = 2 }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export const Donut = ({ pct = 0, size = 64, color = GOLD, bg = '#E8E4DB', thick = 6 }: DonutProps) => {
  const r    = (size / 2) - thick
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(100, pct) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={thick} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thick}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  )
}

export const MetricCard = ({ icon, value, label, sub, color, pct, ring, alert }: MetricProps) => {
  const w      = useW()
  const valSize = w < BP.tablet ? 22 : 24
  const cs     = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  return (
    <div style={{ ...cs, marginBottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between', minHeight: 148, background: `linear-gradient(135deg, ${WHITE} 60%, ${color}15 100%)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon.length <= 4
            ? <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
            : <SvgIcon d={icon} size={20} color={color} />}
        </div>
        {ring !== undefined && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Donut pct={ring} size={52} color={alert ? '#DC2626' : color} thick={5} bg={BORDER} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: alert ? '#DC2626' : color }}>
              {ring}%
            </div>
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: valSize, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1, marginBottom: 3 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily: FONT_BODY }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4, fontFamily: FONT_BODY }}>{sub}</div>}
        {pct !== undefined && (
          <div style={{ marginTop: 10, height: 3, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2 }} />
          </div>
        )}
      </div>
    </div>
  )
}

export const Toast = ({ message, visible }: ToastProps) => {
  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: NAVY2, color: WHITE, borderRadius: 10, padding: '12px 26px',
      fontSize: 14, fontWeight: 600, boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
      zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap',
      animation: visible ? 'toastIn 0.3s ease forwards' : 'toastOut 0.3s ease forwards',
      letterSpacing: '0.01em',
    }}>
      {message}
    </div>
  )
}
