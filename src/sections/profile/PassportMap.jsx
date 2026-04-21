// ─────────────────────────────────────────────────────────────────────────────
// profile/PassportMap.jsx — Stylised world map with port pins
//
// Equirectangular projection:
//   x% = ((lng + 180) / 360) * 100
//   y% = ((85  - lat) / 170) * 100
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY2, NAVY, GOLD, WHITE, BORDER, MUTED, TEAL, ROSE, PLUM, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { PORTS, MAP_SUMMARY } from './profileData'

// Project lat/lng → percentage position
const px = lng => ((lng + 180) / 360) * 100
const py = lat => ((85 - lat) / 170) * 100

// ── Simplified continent SVG blobs ─────────────────────────────────────────────
// Paths are drawn in a 100×48 viewBox matching the map's approximate aspect ratio
function Continents() {
  const fill   = '#DCFCE7'
  const stroke = '#86EFAC'
  return (
    <svg
      viewBox="0 0 100 48"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', opacity: 0.85 }}
      aria-hidden="true"
    >
      {/* North America */}
      <path d="M 4,3 L 12,1 L 22,2 L 31,5 L 35,11 L 33,18 L 29,21 L 22,22 L 14,20 L 8,17 L 4,11 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* South America */}
      <path d="M 27,21 L 35,20 L 41,23 L 42,29 L 40,35 L 36,41 L 31,42 L 27,37 L 25,30 L 26,24 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* Greenland */}
      <path d="M 20,0 L 28,0 L 30,3 L 26,6 L 20,5 L 18,2 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* Europe */}
      <path d="M 45,4 L 56,2 L 62,5 L 63,10 L 59,14 L 52,15 L 46,12 L 44,8 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* Africa */}
      <path d="M 46,15 L 56,13 L 64,15 L 66,21 L 64,29 L 59,35 L 53,35 L 47,31 L 45,23 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* Asia (large) */}
      <path d="M 62,2 L 80,1 L 91,3 L 93,9 L 90,16 L 84,22 L 76,25 L 65,23 L 60,17 L 60,9 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* Indian subcontinent */}
      <path d="M 71,22 L 77,21 L 80,26 L 78,32 L 74,33 L 70,28 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* Southeast Asia */}
      <path d="M 83,22 L 90,20 L 94,25 L 92,30 L 86,31 L 83,27 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* Australia */}
      <path d="M 82,28 L 91,27 L 94,31 L 93,37 L 88,39 L 82,37 L 80,33 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* Japan / East Asia islands */}
      <path d="M 90,8 L 93,7 L 95,10 L 93,13 L 90,12 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* UK / Ireland */}
      <path d="M 47,7 L 50,6 L 51,9 L 49,11 L 47,9 Z"
        fill={fill} stroke={stroke} strokeWidth="0.3" />
    </svg>
  )
}

// ── Legend dot ────────────────────────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{label}</span>
    </div>
  )
}

export default function PassportMap() {
  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1.6 1 0', minWidth: 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>PASSPORT</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Ports Visited</h2>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <LegendDot color={TEAL}  label="Mediterranean" />
          <LegendDot color={PLUM}  label="Caribbean"     />
          <LegendDot color={ROSE}  label="Nordic"        />
        </div>
      </div>

      {/* Map */}
      <div style={{
        position: 'relative', paddingBottom: '48%', height: 0, overflow: 'hidden',
        borderRadius: 14,
        background: 'linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Continents />

          {/* Port pins */}
          {PORTS.map(port => {
            const left = `${px(port.lng)}%`
            const top  = `${py(port.lat)}%`
            const isHighlight = port.color === GOLD
            return (
              <div
                key={port.name}
                title={port.name}
                tabIndex={0}
                style={{
                  position: 'absolute',
                  left, top,
                  transform: 'translate(-50%, -50%)',
                  width: isHighlight ? 12 : 10,
                  height: isHighlight ? 12 : 10,
                  borderRadius: '50%',
                  background: port.color,
                  border: '2px solid white',
                  boxShadow: `0 0 0 3px ${port.color}33`,
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  outline: 'none',
                  zIndex: isHighlight ? 2 : 1,
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.5)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%)'}
                onFocus={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.5)'}
                onBlur={e => e.currentTarget.style.transform = 'translate(-50%, -50%)'}
                aria-label={port.name}
              />
            )
          })}

          {/* Summary chip */}
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
            borderRadius: 20, padding: '5px 12px',
            fontSize: 10, fontWeight: 700, color: NAVY2,
            border: `1px solid ${BORDER}`,
          }}>
            {MAP_SUMMARY}
          </div>
        </div>
      </div>
    </div>
  )
}
