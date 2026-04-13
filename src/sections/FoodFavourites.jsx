// ─────────────────────────────────────────────────────────────────────────────
// sections/FoodFavourites.jsx — End-of-voyage food reflections
//
// A reflective summary of the best (and worst) food moments of the entire
// cruise. Unlike Food Log which captures individual meals, this section is
// filled in once at the end of the voyage as a curated set of highlights.
// Data is stored as a flat object under "csj-foodFav".
// ─────────────────────────────────────────────────────────────────────────────

import { BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Box, TA } from '../components/ui'

// Each entry is a [storageKey, sectionTitle] pair rendered as a Box with a TA.
// Adding a new reflection category only requires adding a row here.
const FIELDS = [
  ['best',       'BEST DISH OF THE ENTIRE CRUISE'],
  ['buffet',     'BEST BUFFET FIND'],
  ['specialty',  'BEST SPECIALITY RESTAURANT'],
  ['surprising', 'MOST SURPRISING FLAVOUR'],
  ['recreate',   "DISH I'D RECREATE AT HOME"],
  ['regret',     'BIGGEST FOOD REGRET'],
]

export default function FoodFavourites({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  // Update a single field on the flat object without mutating state
  const set = (f, v) => onChange({ ...data, [f]: v })

  return (
    <div>
      <PgHdr title="Food Favourites" sub="Reflecting on the very best bites of the entire voyage" />
      <div style={cs}>
        {/* Render one Box section per reflection category */}
        {FIELDS.map(([k, lbl]) => (
          <Box key={k} title={lbl}>
            <TA value={data[k]} onChange={v => set(k, v)} rows={3} placeholder="Your thoughts..." />
          </Box>
        ))}
      </div>
    </div>
  )
}
