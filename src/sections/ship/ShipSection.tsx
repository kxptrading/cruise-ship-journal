// ─────────────────────────────────────────────────────────────────────────────
// sections/ship/ShipSection.tsx — "The Ship" journal section
//
// Singleton per voyage (one ship record). Three parts:
//   1. Ship identity + specs grid (year built, tonnage, capacity, decks…)
//   2. A free-form list of fun facts
//   3. A photo gallery (reuses MediaUploader → daily-photos bucket)
//
// Ship name / cruise line are prefilled from the voyage record (as placeholders
// + the section header) so the field starts populated but stays editable.
// All edits call onChange({ ...data, … }) — the singleton write-through in
// useVoyageData handles persistence + offline sync. Rides the 'ship' entity type.
// ─────────────────────────────────────────────────────────────────────────────

import { TEAL, GOLD, NAVY2, MUTED, BORDER, WHITE, FONT_DISPLAY, FONT_BODY, BP } from '@/constants'
import { useW } from '@/context'
import { PgHdr, Box, Fld, Inp, TA } from '@/components/ui'
import MediaUploader from '@/ui/MediaUploader'
import type { Ship, Voyage } from '@/types'
import { Plus, X } from 'lucide-react'

// Structured spec fields — the "fun facts you can look up about any ship".
const SPECS: { key: keyof Ship; label: string; placeholder: string }[] = [
  { key: 'yearBuilt',     label: 'Year Built',      placeholder: 'e.g. 2022' },
  { key: 'builder',       label: 'Built By',        placeholder: 'e.g. Chantiers de l’Atlantique' },
  { key: 'tonnage',       label: 'Gross Tonnage',   placeholder: 'e.g. 236,857 GT' },
  { key: 'length',        label: 'Length',          placeholder: 'e.g. 362 m' },
  { key: 'beam',          label: 'Beam (Width)',    placeholder: 'e.g. 64 m' },
  { key: 'maxSpeed',      label: 'Top Speed',       placeholder: 'e.g. 22 knots' },
  { key: 'guestCapacity', label: 'Guest Capacity',  placeholder: 'e.g. 5,610' },
  { key: 'crewCount',     label: 'Crew',            placeholder: 'e.g. 2,350' },
  { key: 'decks',         label: 'Decks',           placeholder: 'e.g. 18' },
  { key: 'godmother',     label: 'Godmother',       placeholder: 'Who christened her?' },
  { key: 'homePort',      label: 'Home Port',       placeholder: 'e.g. Miami, FL' },
  { key: 'registry',      label: 'Registry / Flag',  placeholder: 'e.g. Bahamas' },
  { key: 'maidenVoyage',  label: 'Maiden Voyage',   placeholder: 'e.g. March 2022' },
]

interface Props {
  data:     Partial<Ship>
  onChange: (updated: Partial<Ship>) => void
  voyage:   Voyage
  userId:   string | null
}

export default function ShipSection({ data, onChange, voyage, userId }: Props) {
  const w    = useW()
  const cols = w < BP.mobile ? 1 : 2

  const set = (f: keyof Ship, v: string) => onChange({ ...data, [f]: v })

  // Prefill identity from the voyage record (editable; placeholder-based so the
  // input stays honestly controlled and clearable).
  const displayName = data.shipName  || voyage.shipName  || 'Your Ship'
  const displayLine = data.cruiseLine || voyage.cruiseLine || ''

  // ── Fun facts (array of strings) ──────────────────────────────────────────
  const facts = data.funFacts ?? []
  const setFact    = (i: number, v: string) => onChange({ ...data, funFacts: facts.map((f, j) => j === i ? v : f) })
  const addFact    = ()        => onChange({ ...data, funFacts: [...facts, ''] })
  const removeFact = (i: number) => onChange({ ...data, funFacts: facts.filter((_, j) => j !== i) })

  // ── Gallery (storage paths) ───────────────────────────────────────────────
  const paths = data.mediaPaths ?? []
  const addPath    = (p: string) => onChange({ ...data, mediaPaths: [...paths, p] })
  const removePath = (p: string) => onChange({ ...data, mediaPaths: paths.filter(x => x !== p) })

  return (
    <div>
      <PgHdr icon="🚢" title="The Ship" sub="Your floating home — the headline of the whole voyage" />

      {/* Hero identity banner */}
      <div style={{
        background:   `linear-gradient(135deg, var(--t-primary-dk), var(--t-primary))`,
        borderRadius: 16,
        padding:      '22px 24px',
        marginBottom: 20,
        color:        WHITE,
      }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, lineHeight: 1.1 }}>
          {displayName}
        </div>
        {displayLine && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: GOLD, marginTop: 6, fontWeight: 600 }}>
            {displayLine}
          </div>
        )}
      </div>

      {/* Identity (editable) */}
      <Box title="SHIP IDENTITY" emoji="⚓" color={NAVY2}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `0 16px` }}>
          <Fld label="Ship Name">
            <Inp value={data.shipName || ''} onChange={v => set('shipName', v)} placeholder={voyage.shipName || 'e.g. Wonder of the Seas'} />
          </Fld>
          <Fld label="Cruise Line">
            <Inp value={data.cruiseLine || ''} onChange={v => set('cruiseLine', v)} placeholder={voyage.cruiseLine || 'e.g. Royal Caribbean'} />
          </Fld>
        </div>
      </Box>

      {/* Specs grid */}
      <Box title="SHIP SPECS" emoji="📐" color={TEAL}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `0 16px` }}>
          {SPECS.map(({ key, label, placeholder }) => (
            <Fld key={key} label={label}>
              <Inp value={(data[key] as string) || ''} onChange={v => set(key, v)} placeholder={placeholder} />
            </Fld>
          ))}
        </div>
      </Box>

      {/* Fun facts */}
      <Box title="FUN FACTS" emoji="✨" color={GOLD}>
        {facts.length === 0 && (
          <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY, marginBottom: 12 }}>
            Record the standout details — the tallest slide at sea, a record-breaking atrium, the story behind her name…
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {facts.map((fact, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: GOLD, fontSize: 18, lineHeight: '40px', flexShrink: 0 }}>•</span>
              <div style={{ flex: 1 }}>
                <Inp value={fact} onChange={v => setFact(i, v)} placeholder="Add a fun fact…" />
              </div>
              <button
                onClick={() => removeFact(i)}
                aria-label="Remove fun fact"
                style={{ flexShrink: 0, marginTop: 9, width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addFact}
          style={{ marginTop: facts.length ? 14 : 0, display: 'inline-flex', alignItems: 'center', gap: 6, background: WHITE, border: `1px dashed ${GOLD}`, color: NAVY2, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, cursor: 'pointer' }}
        >
          <Plus size={15} /> Add a fun fact
        </button>
      </Box>

      {/* Photo gallery */}
      <Box title="PHOTO GALLERY" emoji="📸" color={NAVY2}>
        {!userId && (
          <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY, marginBottom: 12 }}>
            Sign in to add photos of the ship.
          </div>
        )}
        <MediaUploader
          paths={paths}
          userId={userId}
          onAdd={addPath}
          onRemove={removePath}
          maxFiles={20}
        />
      </Box>

      {/* Free-text notes */}
      <Box title="NOTES" emoji="📝" color={TEAL}>
        <TA value={data.notes || ''} onChange={v => set('notes', v)} rows={4} placeholder="Anything else worth remembering about the ship — layout tips, favourite spots, deck you stayed on…" />
      </Box>
    </div>
  )
}
