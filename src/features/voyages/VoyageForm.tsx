// ─────────────────────────────────────────────────────────────────────────────
// sections/VoyageDetails.tsx — Voyage setup form
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { BP, sty, MUTED, NAVY2, GOLD, BORDER, FONT_BODY } from '@/constants'
import { useW } from '@/context'
import { PgHdr, Box, Fld, Row2, Inp, TA } from '@/components/ui'
import FE from '@/components/FE'
import type { Voyage } from '@/types'

interface Props {
  data:     Voyage
  onChange: (updated: Voyage) => void
}

export default function VoyageDetails({ data, onChange }: Props) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const [showPin, setShowPin] = useState(false)

  const set = (f: keyof Voyage, v: string) => {
    const updated: Voyage = { ...data, [f]: v }
    const dep = updated.departureDate
    const ret = updated.returnDate
    if (dep && ret) {
      const nights = Math.round((new Date(ret + 'T00:00:00').getTime() - new Date(dep + 'T00:00:00').getTime()) / 86400000)
      if (nights > 0) updated.totalNights = String(nights)
    }
    onChange(updated)
  }

  return (
    <div>
      <PgHdr icon="🚢" title="Voyage Details" sub="All the essentials for your journey at sea" />
      <div style={cs}>

        <Box title="SHIP INFORMATION">
          <Row2>
            <Fld label="Ship Name" half><Inp value={data.shipName} onChange={(v: string) => set('shipName', v)} placeholder="e.g. Wonder of the Seas" /></Fld>
            <Fld label="Cruise Line" half><Inp value={data.cruiseLine} onChange={(v: string) => set('cruiseLine', v)} placeholder="e.g. Royal Caribbean" /></Fld>
          </Row2>
          <Fld label="Cruise Description">
            <TA value={data.cruiseDescription || ''} onChange={(v: string) => set('cruiseDescription', v)} placeholder="Describe your cruise — itinerary, highlights, what to expect…" rows={3} />
          </Fld>
          <Row2>
            <Fld label="Cabin Number & Type" half><Inp value={data.cabin} onChange={(v: string) => set('cabin', v)} placeholder="e.g. 8234 — Balcony" /></Fld>
            <Fld label="Deck" half><Inp value={data.deck} onChange={(v: string) => set('deck', v)} placeholder="e.g. Deck 8" /></Fld>
          </Row2>
        </Box>

        <Box title="DATES & DEPARTURE">
          <Row2>
            <Fld label="Departure Date" half><Inp type="date" value={data.departureDate} onChange={(v: string) => set('departureDate', v)} /></Fld>
            <Fld label="Return Date" half><Inp type="date" value={data.returnDate} onChange={(v: string) => set('returnDate', v)} /></Fld>
          </Row2>
          <Row2>
            <Fld label="Departure Port" half><Inp value={data.departurePort} onChange={(v: string) => set('departurePort', v)} placeholder="e.g. Southampton" /></Fld>
            <Fld label="Total Nights" half>
              {data.totalNights ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: `1px solid ${GOLD}50`, borderRadius: 8,
                  padding: '10px 14px', background: `${GOLD}10`,
                }}>
                  <FE emoji="🌙" size={16} />
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: 20, color: NAVY2, fontWeight: 400, lineHeight: 1 }}>{data.totalNights}</span>
                  <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>night{data.totalNights !== '1' ? 's' : ''}</span>
                </div>
              ) : (
                <div style={{ border: '1px solid #E0DBD0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: MUTED, fontFamily: FONT_BODY, fontStyle: 'italic' }}>
                  Set both dates above
                </div>
              )}
            </Fld>
          </Row2>
        </Box>

        <Box title="TRAVEL COMPANIONS">
          {([1, 2, 3, 4] as const).map(n => (
            <Fld key={n} label={`Companion ${n}`}>
              <Inp value={data[`companion${n}` as keyof Voyage] as string} onChange={(v: string) => set(`companion${n}` as keyof Voyage, v)} placeholder="Full name" />
            </Fld>
          ))}
        </Box>

        <Box title="IMPORTANT CRUISE INFORMATION">
          <Row2>
            <Fld label="Service Desk Number" half><Inp value={data.guestServices} onChange={(v: string) => set('guestServices', v)} placeholder="e.g. 911 or ext. 20" /></Fld>
            <Fld label="Muster Station" half><Inp value={data.musterStation} onChange={(v: string) => set('musterStation', v)} placeholder="e.g. Station C" /></Fld>
          </Row2>
          <Row2>
            <Fld label="Breakfast Time" half><Inp value={data.breakfastTime} onChange={(v: string) => set('breakfastTime', v)} placeholder="e.g. 07:00 – 10:00" /></Fld>
            <Fld label="Lunch Time" half><Inp value={data.lunchTime} onChange={(v: string) => set('lunchTime', v)} placeholder="e.g. 12:00 – 14:00" /></Fld>
          </Row2>
          <Fld label="Dining Time"><Inp value={data.diningTime} onChange={(v: string) => set('diningTime', v)} placeholder="e.g. 18:30 — Main Dining Room" /></Fld>
          <Row2>
            <Fld label="Room Location" half>
              <select
                value={data.roomLocation}
                onChange={e => set('roomLocation', e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${BORDER}`, background: '#fff',
                  fontSize: 14, fontFamily: FONT_BODY, color: data.roomLocation ? NAVY2 : MUTED,
                  appearance: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Select position…</option>
                <option value="Fore">Fore (Forward)</option>
                <option value="Midship">Midship (Middle)</option>
                <option value="Aft">Aft (Rear)</option>
              </select>
            </Fld>
            <Fld label="Safebox PIN" half>
              <div style={{ position: 'relative' }}>
                <Inp
                  type={showPin ? 'text' : 'password'}
                  value={data.safeboxPin}
                  onChange={(v: string) => set('safeboxPin', v)}
                  placeholder="••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(p => !p)}
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 2,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Fld>
          </Row2>
        </Box>

      </div>
    </div>
  )
}
