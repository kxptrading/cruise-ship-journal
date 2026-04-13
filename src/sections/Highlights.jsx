import { BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, TA } from '../components/ui'

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
  const set = (f, v) => onChange({ ...data, [f]: v })

  return (
    <div>
      <PgHdr title="Cruise Highlights & Memories" sub="The moments that defined this voyage" />
      <div style={cs}>
        {FIELDS.map(([k, lbl]) => (
          <Fld key={k} label={lbl}>
            <TA value={data[k]} onChange={v => set(k, v)} rows={3} placeholder="Write your memory here..." />
          </Fld>
        ))}
      </div>
    </div>
  )
}
