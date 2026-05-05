// ─────────────────────────────────────────────────────────────────────────────
// feed/FeedMetrics.tsx — Quick-stat metric cards strip below the hero banner
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, MUTED, FONT_DISPLAY, FONT_BODY, BP } from '../../constants'
import { useW } from '../../context'

export interface Metric {
  icon:  string
  value: string
  label: string
  color: string
  nav:   string
}

interface Props {
  metrics: Metric[]
  onNav:   (section: string) => void
}

export default function FeedMetrics({ metrics, onNav }: Props) {
  const w = useW()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${w < BP.mobile ? 2 : 4}, 1fr)`, gap: 10, marginBottom: 16 }}>
      {metrics.map(m => (
        <button
          key={m.label}
          onClick={() => onNav(m.nav)}
          style={{ background: `linear-gradient(135deg, ${WHITE} 60%, ${m.color}18 100%)`, border: `1px solid ${BORDER}`, borderRadius: 16, padding: w < BP.mobile ? '10px 8px' : '12px 14px', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${m.color}28`; e.currentTarget.style.borderColor = `${m.color}55` }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = BORDER }}
        >
          <div style={{ fontSize: 20, marginBottom: 3 }}>{m.icon}</div>
          <div style={{ fontSize: w < BP.mobile ? 16 : 22, fontWeight: 400, color: m.color, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{m.value}</div>
          <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3, fontFamily: FONT_BODY }}>{m.label}</div>
        </button>
      ))}
    </div>
  )
}
