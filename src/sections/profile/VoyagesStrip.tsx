// ─────────────────────────────────────────────────────────────────────────────
// profile/VoyagesStrip.tsx — Compact 3-column voyage card grid
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, NAVY2, NAVY, GOLD, MUTED, LIGHT, TEAL, PLUM, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { useW } from '../../context'
import type { VoyageListRow } from '../../types'

const ACCENT_CYCLE = [NAVY, PLUM, TEAL, GOLD]

interface Props {
  allVoyages: VoyageListRow[]
  onViewAll:  () => void
}

export default function VoyagesStrip({ allVoyages, onViewAll }: Props) {
  const w = useW()
  const cols = w < 480 ? 1 : w < 700 ? 2 : 3

  const today = new Date()

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', marginBottom: 20 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>JOURNEY</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>My Voyages</h2>
        </div>
        <button
          onClick={onViewAll}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: FONT_BODY, padding: '4px 0' }}
        >
          View all →
        </button>
      </div>

      {allVoyages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: MUTED, fontSize: 13 }}>
          No voyages yet — add your first one in Voyage Details.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
          {allVoyages.map((v, i) => {
            const accent  = ACCENT_CYCLE[i % ACCENT_CYCLE.length]
            const depDate = v.departure_date ? new Date(v.departure_date + 'T00:00:00') : null
            const retDate = v.return_date    ? new Date(v.return_date    + 'T00:00:00') : null
            const isActive = depDate && retDate && today >= depDate && today <= retDate

            return (
              <div
                key={v.id}
                tabIndex={0}
                style={{
                  borderLeft: `4px solid ${accent}`,
                  background: LIGHT, borderRadius: '0 10px 10px 0',
                  padding: '12px 14px',
                  outline: 'none',
                  transition: 'transform 0.15s',
                  cursor: 'default',
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}55` }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
                aria-label={`${v.ship_name || 'Unnamed voyage'}, ${isActive ? 'active' : 'past'}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {v.cruise_line || 'Cruise'}
                  </div>
                  {isActive && (
                    <div style={{ fontSize: 8, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', borderRadius: 20, padding: '2px 7px', letterSpacing: '0.06em' }}>
                      NOW
                    </div>
                  )}
                </div>

                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: NAVY2, marginBottom: 6 }}>
                  {v.ship_name || 'Unnamed Voyage'}
                </div>

                <div style={{ display: 'flex', gap: 8, fontSize: 10.5, color: MUTED, fontFamily: FONT_BODY, flexWrap: 'wrap' }}>
                  {depDate && (
                    <span>
                      {depDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                  )}
                  {v.total_nights && (
                    <span>· {v.total_nights} nights</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
