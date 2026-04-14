// ─────────────────────────────────────────────────────────────────────────────
// components/ui.jsx — Shared primitive UI components
//
// Small, single-purpose building blocks used across all section pages.
// Every component here reads the viewport width via useW() so it can adapt
// its own sizing without needing the parent to pass a width prop.
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, GOLD, BORDER, TEXT, MUTED, LIGHT, WHITE } from '../constants'
import { sty } from '../constants'
import { BP } from '../constants'
import { useW } from '../context'

// Uppercase micro-label rendered above form fields.
export const Lbl = ({ c }) => <label style={sty.lbl}>{c}</label>

// Controlled text input. Applies the shared sty.inp style and normalises the
// value to an empty string when undefined so React never switches from
// uncontrolled to controlled mode.
export const Inp = ({ value, onChange, placeholder, type = 'text', style = {} }) => (
  <input
    type={type}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{ ...sty.inp, ...style }}
  />
)

// Multi-line textarea with the same base styling as Inp. resize: vertical lets
// users expand it; lineHeight 1.7 keeps long journal entries readable.
export const TA = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{ ...sty.inp, resize: 'vertical', lineHeight: 1.7 }}
  />
)

// Form field wrapper — adds a bottom margin and optionally sets flex: 1 so
// it can grow equally inside a Row2 layout.
export const Fld = ({ label, children, half }) => (
  <div style={{ marginBottom: 16, flex: half ? '1' : undefined }}>
    <Lbl c={label} />
    {children}
  </div>
)

// Two-column row for side-by-side form fields. Stacks to a single column on
// mobile so narrow screens stay usable. Children should use the half prop on
// Fld to flex-grow into the available space.
export const Row2 = ({ children }) => {
  const w = useW()
  return (
    <div style={{ display: 'flex', flexDirection: w < BP.mobile ? 'column' : 'row', gap: 16 }}>
      {children}
    </div>
  )
}

// Section box — a titled grouping block used inside cards. Navy header bar
// with a LIGHT background body, matching the physical journal's section style.
export const Box = ({ title, children }) => (
  <div style={{ borderRadius: 8, marginBottom: 20, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
    <div style={{ background: NAVY, color: WHITE, padding: '8px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
      {title}
    </div>
    <div style={{ padding: 16, background: LIGHT }}>{children}</div>
  </div>
)

// Interactive 5-star rating. Filled stars are gold, empty stars use the border
// colour. Clicking a star that's already selected does not clear the rating —
// to clear, the parent should pass onChange(0) via a separate control.
export const Stars = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} onClick={() => onChange(n)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: n <= value ? GOLD : BORDER, padding: 0, lineHeight: 1 }}>
        ★
      </button>
    ))}
  </div>
)

// Page heading with a gold underline bar. Font size steps down at mobile and
// tablet breakpoints. The sub prop is optional supporting copy shown below.
export const PgHdr = ({ title, sub, icon }) => {
  const w = useW()
  const h1Size = w < BP.mobile ? 24 : w < BP.tablet ? 27 : 30
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ margin: 0, fontSize: h1Size, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,"Times New Roman",serif' }}>
        {icon && <span style={{ marginRight: 10 }}>{icon}</span>}{title}
      </h1>
      {sub && <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 14 }}>{sub}</p>}
      {/* Gold accent bar beneath the title */}
      <div style={{ height: 3, background: GOLD, width: 56, marginTop: 12, borderRadius: 2 }} />
    </div>
  )
}

// Renders a single SVG icon from an IC path string. Uses stroke (not fill) so
// icons match the line-art aesthetic of the design system.
export const SvgIcon = ({ d, size = 18, color = 'currentColor', weight = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

// SVG donut/ring chart. Used in metric cards and the dashboard hero.
// pct (0–100) controls how much of the ring is filled. The ring is drawn with
// two stacked circles — one for the track, one for the fill — using
// strokeDasharray to clip the fill arc.
export const Donut = ({ pct = 0, size = 64, color = GOLD, bg = '#E8E4DB', thick = 6 }) => {
  const r    = (size / 2) - thick
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(100, pct) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={thick} />
      {/* Filled arc — rotated -90° so it starts at the top */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thick}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  )
}

// Summary card used in the Dashboard metrics grid. Shows an icon badge, a
// large serif value, an uppercase label, optional supporting text, and
// optionally either a progress bar (pct) or a donut ring (ring).
export const MetricCard = ({ icon, value, label, sub, color, pct, ring, alert }) => {
  const w      = useW()
  const valSize = w < BP.tablet ? 22 : 24
  const cs     = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  return (
    <div style={{ ...cs, marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 148 }}>
      {/* Top row: icon badge (left) + optional donut ring (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon.length <= 4
            ? <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
            : <SvgIcon d={icon} size={18} color={color} />}
        </div>
        {ring !== undefined && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Donut pct={ring} size={52} color={alert ? '#DC2626' : color} thick={5} bg={BORDER} />
            {/* Percentage label centred inside the ring */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: alert ? '#DC2626' : color }}>
              {ring}%
            </div>
          </div>
        )}
      </div>
      {/* Bottom section: large value, label, sub-text, optional progress bar */}
      <div>
        <div style={{ fontSize: valSize, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', lineHeight: 1, marginBottom: 3 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{sub}</div>}
        {pct !== undefined && (
          <div style={{ marginTop: 10, height: 3, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2 }} />
          </div>
        )}
      </div>
    </div>
  )
}
