// ─────────────────────────────────────────────────────────────────────────────
// sections/food/FoodHub.tsx — Combined Food & Dining tab
//
// Consolidates the three former top-level food tabs (Food Log, Dining, Favourites)
// under one tab with an internal segmented sub-nav, so the journal tab strip isn't
// overwhelming. Each sub-section is the existing component, unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, lazy, Suspense } from 'react'
import { WHITE, NAVY2, BORDER, MUTED, FONT_BODY } from '../../constants'
import { SkeletonCard } from '../../components/ui/skeleton'
import FE from '../../components/FE'
import type { VoyageData } from '../../types'

const FoodLog        = lazy(() => import('../FoodLog'))
const DiningLog      = lazy(() => import('../DiningLog'))
const FoodFavourites = lazy(() => import('../FoodFavourites'))

interface Props {
  data:   VoyageData
  update: (key: keyof VoyageData, val: VoyageData[keyof VoyageData]) => void
}

type Sub = 'meals' | 'dining' | 'favourites'
const SUBS: { id: Sub; label: string; emoji: string }[] = [
  { id: 'meals',      label: 'Food Log',    emoji: '🍽️' },
  { id: 'dining',     label: 'Restaurants', emoji: '🍴' },
  { id: 'favourites', label: 'Favourites',  emoji: '💛' },
]

export default function FoodHub({ data, update }: Props) {
  const [sub, setSub] = useState<Sub>('meals')

  return (
    <div>
      {/* Segmented sub-nav */}
      <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: '#F4F3EF', border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        {SUBS.map(s => {
          const on = sub === s.id
          return (
            <button
              key={s.id}
              onClick={() => setSub(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
                background: on ? WHITE : 'transparent', color: on ? NAVY2 : MUTED,
                fontWeight: on ? 700 : 500, fontSize: 13, fontFamily: FONT_BODY,
                borderRadius: 9, padding: '7px 14px',
                boxShadow: on ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <FE emoji={s.emoji} size={14} /> {s.label}
            </button>
          )
        })}
      </div>

      <Suspense fallback={<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><SkeletonCard /><SkeletonCard /></div>}>
        {sub === 'meals'      && <FoodLog        data={data.foodLogs} onChange={v => update('foodLogs', v)} />}
        {sub === 'dining'     && <DiningLog      data={data.diningLog} onChange={v => update('diningLog', v)} />}
        {sub === 'favourites' && <FoodFavourites data={data.foodFav}  onChange={v => update('foodFav', v)} />}
      </Suspense>
    </div>
  )
}
