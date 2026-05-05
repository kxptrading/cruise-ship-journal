// ─────────────────────────────────────────────────────────────────────────────
// sections/Highlights.tsx — Cruise highlight moments
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, MUTED, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Box, Fld, TA } from '../components/ui'
import type { Highlights } from '../types'

// [storageKey, display label] tuples — key matches the Highlights interface
const FIELDS: [keyof Highlights, string][] = [
  ['port',      'Favourite Port'],
  ['meal',      'Most Memorable Meal'],
  ['funny',     'Funniest Moment'],
  ['view',      'Best View'],
  ['friends',   'Best Moment with Friends / Family'],
  ['firstTime', 'Something I Did for the First Time'],
  ['moment',    'The Single Moment I\'ll Never Forget'],
]

interface Props {
  data:     Partial<Highlights>
  onChange: (updated: Partial<Highlights>) => void
}

export default function HighlightsSection({ data, onChange }: Props) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const set = (f: keyof Highlights, v: string) => onChange({ ...data, [f]: v })

  return (
    <div>
      <PgHdr icon="🏆" title="Cruise Highlights" sub="The moments you'll tell stories about for years" />

      <div style={cs}>
        <Box title="STANDOUT MOMENTS">
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
