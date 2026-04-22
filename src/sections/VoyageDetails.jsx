// ─────────────────────────────────────────────────────────────────────────────
// sections/VoyageDetails.jsx — Voyage setup form
//
// Captures the core details of the cruise: ship info, dates, travel companions,
// and important on-board numbers. Data is stored as a flat object under the
// "csj-voyage" key and drives the hero panel on the Dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import { BP, sty, MUTED, NAVY2, GOLD, FONT_BODY } from '../constants'
import { useW } from '../context'
import { PgHdr, Box, Fld, Row2, Inp } from '../components/ui'

export default function VoyageDetails({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  // Helper: update a single field on the voyage object without mutating state
  const set = (f, v) => {
    const updated = { ...data, [f]: v }
    // Recalculate totalNights whenever either date changes
    const dep = updated.departureDate
    const ret = updated.returnDate
    if (dep && ret) {
      const nights = Math.round((new Date(ret + 'T00:00:00') - new Date(dep + 'T00:00:00')) / 86400000)
      updated.totalNights = nights > 0 ? String(nights) : updated.totalNights
    }
    onChange(updated)
  }

  return (
    <div>
      <PgHdr icon="🚢" title="Voyage Details" sub="All the essentials for your journey at sea" />
      <div style={cs}>

        {/* Ship name, cruise line, cabin number and deck */}
        <Box title="SHIP INFORMATION">
          <Fld label="Cruise Line"><Inp value={data.cruiseLine} onChange={v => set('cruiseLine', v)} placeholder="e.g. Royal Caribbean" /></Fld>
          <Fld label="Ship Name"><Inp value={data.shipName} onChange={v => set('shipName', v)} placeholder="e.g. Wonder of the Seas" /></Fld>
          <Row2>
            <Fld label="Cabin Number & Type" half><Inp value={data.cabin} onChange={v => set('cabin', v)} placeholder="e.g. 8234 — Balcony" /></Fld>
            <Fld label="Deck" half><Inp value={data.deck} onChange={v => set('deck', v)} placeholder="e.g. Deck 8" /></Fld>
          </Row2>
        </Box>

        {/* Departure and return dates, home port, and total night count */}
        <Box title="DATES & DEPARTURE">
          <Row2>
            <Fld label="Departure Date" half><Inp type="date" value={data.departureDate} onChange={v => set('departureDate', v)} /></Fld>
            <Fld label="Return Date" half><Inp type="date" value={data.returnDate} onChange={v => set('returnDate', v)} /></Fld>
          </Row2>
          <Row2>
            <Fld label="Departure Port" half><Inp value={data.departurePort} onChange={v => set('departurePort', v)} placeholder="e.g. Southampton" /></Fld>
            <Fld label="Total Nights" half>
              {data.totalNights ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: `1px solid ${GOLD}50`, borderRadius: 8,
                  padding: '10px 14px', background: `${GOLD}10`,
                }}>
                  <span style={{ fontSize: 16 }}>🌙</span>
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: 20, color: NAVY2, fontWeight: 400, lineHeight: 1 }}>{data.totalNights}</span>
                  <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>night{data.totalNights !== '1' ? 's' : ''}</span>
                </div>
              ) : (
                <div style={{ border: `1px solid #E0DBD0`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: MUTED, fontFamily: FONT_BODY, fontStyle: 'italic' }}>
                  Set both dates above
                </div>
              )}
            </Fld>
          </Row2>
        </Box>

        {/* Up to 4 named travel companions */}
        <Box title="TRAVEL COMPANIONS">
          {[1, 2, 3, 4].map(n => (
            <Fld key={n} label={`Companion ${n}`}><Inp value={data[`companion${n}`]} onChange={v => set(`companion${n}`, v)} placeholder="Full name" /></Fld>
          ))}
        </Box>

        {/* Key phone numbers and on-board reference info */}
        <Box title="IMPORTANT NUMBERS">
          <Row2>
            <Fld label="Emergency Contact" half><Inp value={data.emergencyContact} onChange={v => set('emergencyContact', v)} /></Fld>
            <Fld label="Phone" half><Inp value={data.phone} onChange={v => set('phone', v)} /></Fld>
          </Row2>
          <Row2>
            <Fld label="Guest Services" half><Inp value={data.guestServices} onChange={v => set('guestServices', v)} /></Fld>
            <Fld label="Muster Station" half><Inp value={data.musterStation} onChange={v => set('musterStation', v)} /></Fld>
          </Row2>
          <Fld label="Dining Time"><Inp value={data.diningTime} onChange={v => set('diningTime', v)} placeholder="e.g. 18:30 — Main Dining Room" /></Fld>
        </Box>

      </div>
    </div>
  )
}
