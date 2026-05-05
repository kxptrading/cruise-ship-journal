// ─────────────────────────────────────────────────────────────────────────────
// sections/FoodFavourites.tsx — Best food moments of the voyage
// ─────────────────────────────────────────────────────────────────────────────

import { BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Box, Fld, TA } from '../components/ui'
import type { FoodFavourites } from '../types'

const FIELDS: [keyof FoodFavourites, string][] = [
  ['best',       'Best Meal Overall'],
  ['buffet',     'Best Buffet Find'],
  ['specialty',  'Best Specialty Restaurant Dish'],
  ['surprising', 'Most Surprising Food Discovery'],
  ['recreate',   'Dish I Want to Recreate at Home'],
  ['regret',     'Food Regret (Wish I\'d Ordered More)'],
]

interface Props {
  data:     Partial<FoodFavourites>
  onChange: (updated: Partial<FoodFavourites>) => void
}

export default function FoodFavouritesSection({ data, onChange }: Props) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const set = (f: keyof FoodFavourites, v: string) => onChange({ ...data, [f]: v })

  return (
    <div>
      <PgHdr icon="⭐" title="Food Favourites" sub="The dishes and moments that made this voyage delicious" />

      <div style={cs}>
        <Box title="CULINARY HIGHLIGHTS">
          {FIELDS.map(([key, label]) => (
            <Fld key={key} label={label}>
              <TA
                value={data[key] || ''}
                onChange={(v: string) => set(key, v)}
                rows={3}
                placeholder={`Your ${label.toLowerCase()}…`}
              />
            </Fld>
          ))}
        </Box>
      </div>
    </div>
  )
}
