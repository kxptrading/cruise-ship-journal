// ─────────────────────────────────────────────────────────────────────────────
// sections/Highlights.jsx — Cruise highlights and memorable moments
//
// A reflective end-of-voyage section with seven prompted memory categories.
// Like Food Favourites, this is filled in once rather than updated daily —
// it captures the moments worth remembering long after the ship docks.
// Data is stored as a flat object under "csj-highlights".
// ─────────────────────────────────────────────────────────────────────────────

import { BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, TA } from '../components/ui'

// Each entry is a [storageKey, fieldLabel] pair. Adding a new memory prompt
// only requires adding a row here.
const FIELDS = [
  ['port',      'Favourite port of call and why'],
  ['meal',      'Best meal on the ship'],
  ['funny',     'Funniest moment'],
  ['view',      'Most beautiful view'],
  ['friends',   'New friends I met'],
  ['firstTime', 'Something I tried for the first time'],
  ['moment',    'A moment I never want to forget'],
]

export default function Highlights({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  // Update a single field on the flat object without mutating state
  const set = (f, v) => onChange({ ...data, [f]: v })

  return (
    <div>
      <PgHdr title="Cruise Highlights & Memories" sub="The moments that defined this voyage" />
      <div style={cs}>
        {/* Render one labelled textarea per memory category */}
        {FIELDS.map(([k, lbl]) => (
          <Fld key={k} label={lbl}>
            <TA value={data[k]} onChange={v => set(k, v)} rows={3} placeholder="Write your memory here..." />
          </Fld>
        ))}
      </div>
    </div>
  )
}
