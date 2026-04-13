import { BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Box, TA } from '../components/ui'

const FIELDS = [
  ['best',      'BEST DISH OF THE ENTIRE CRUISE'],
  ['buffet',    'BEST BUFFET FIND'],
  ['specialty', 'BEST SPECIALITY RESTAURANT'],
  ['surprising','MOST SURPRISING FLAVOUR'],
  ['recreate',  "DISH I'D RECREATE AT HOME"],
  ['regret',    'BIGGEST FOOD REGRET'],
]

export default function FoodFavourites({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const set = (f, v) => onChange({ ...data, [f]: v })

  return (
    <div>
      <PgHdr title="Food Favourites" sub="Reflecting on the very best bites of the entire voyage" />
      <div style={cs}>
        {FIELDS.map(([k, lbl]) => (
          <Box key={k} title={lbl}>
            <TA value={data[k]} onChange={v => set(k, v)} rows={3} placeholder="Your thoughts..." />
          </Box>
        ))}
      </div>
    </div>
  )
}
