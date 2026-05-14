// ─────────────────────────────────────────────────────────────────────────────
// components/ui/section-box.tsx — Navy header bar + light body panel
//
// Usage:
//   <SectionBox title="SHIP INFORMATION" icon="🚢">
//     <p>content</p>
//   </SectionBox>
//
//   <SectionBox title="WEATHER" color="#10B981" icon="🌤️">
//     ...
//   </SectionBox>
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties, ReactNode } from 'react'
import { WHITE, LIGHT, BORDER, FONT_BODY } from '../../constants'
import FE from '../FE'

export interface SectionBoxProps {
  title:    string
  children: ReactNode
  color?:   string    // header background; defaults to var(--t-primary-dk)
  icon?:    string    // emoji before the title
  style?:   CSSProperties
  bodyStyle?: CSSProperties
}

export function SectionBox({ title, children, color, icon, style, bodyStyle }: SectionBoxProps) {
  const headerBg = color ?? 'var(--t-primary-dk)'

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, ...style }}>
      <div style={{
        background: headerBg,
        color: WHITE,
        padding: '8px 16px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: FONT_BODY,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        {icon && <FE emoji={icon} size={18} />}
        {title}
      </div>
      <div style={{ padding: 16, background: LIGHT, ...bodyStyle }}>
        {children}
      </div>
    </div>
  )
}
