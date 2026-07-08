// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/TodayQuickAdd.tsx — persistent "＋ Today" quick-add
//
// The app's core action is documenting deck days, so it gets a floating button
// that's always one tap from today's check-in. It resolves the most relevant
// voyage (currently sailing → else nearest by date) and the day index for today,
// then jumps straight to /voyages/:id/journal?tab=daily&day=N. With no voyages
// yet, it routes to the new-voyage form instead.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useVoyages, type VoyageRow } from './hooks'
import { GOLD, NAVY2, FONT_LABEL } from '../../constants'

const MS_DAY = 86_400_000

// Pick the voyage + day index to log for "today".
function resolveToday(voyages: VoyageRow[]): { voyageId: string; day: number } | null {
  if (!voyages.length) return null
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const t = startOfToday.getTime()
  const toDate = (s: string | null) => {
    if (!s) return null
    const d = new Date(s + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  }

  let best: { v: VoyageRow; dep: Date | null; nights: number; dist: number } | null = null
  for (const v of voyages) {
    const dep    = toDate(v.departure_date)
    const nights = v.total_nights ?? 0
    let dist: number
    if (dep) {
      const ret = toDate(v.return_date) ?? new Date(dep.getTime() + nights * MS_DAY)
      // 0 = today falls within the sailing window; else distance to the nearest edge.
      dist = t >= dep.getTime() && t <= ret.getTime()
        ? 0
        : Math.min(Math.abs(t - dep.getTime()), Math.abs(t - ret.getTime()))
    } else {
      dist = Number.MAX_SAFE_INTEGER
    }
    if (!best || dist < best.dist) best = { v, dep, nights, dist }
  }
  if (!best) return { voyageId: voyages[0].id, day: 0 }

  // Day index = days since departure, clamped into the voyage. Future voyage → day 1;
  // past voyage → its last day; currently sailing → today's actual day.
  let day = 0
  if (best.dep) {
    const diff   = Math.floor((t - best.dep.getTime()) / MS_DAY)
    const maxDay = Math.max((best.nights || 1) - 1, 0)
    day = Math.min(Math.max(diff, 0), maxDay)
  }
  return { voyageId: best.v.id, day }
}

export default function TodayQuickAdd({ isMobile }: { isMobile: boolean }) {
  const navigate = useNavigate()
  const { data: voyages = [] } = useVoyages()

  const go = () => {
    const target = resolveToday(voyages)
    if (!target) { navigate('/voyages/new'); return }
    navigate(`/voyages/${target.voyageId}/journal?tab=daily&day=${target.day}`)
  }

  return (
    <button
      onClick={go}
      aria-label="Log today's check-in"
      title="Log today's check-in"
      style={{
        position: 'fixed', zIndex: 490,
        ...(isMobile
          ? { bottom: 'calc(env(safe-area-inset-bottom) + 66px)', right: 16 }
          : { bottom: 78, right: 24 }),
        display: 'flex', alignItems: 'center', gap: 8,
        background: GOLD, color: NAVY2, border: 'none', borderRadius: 999,
        padding: isMobile ? '12px 18px' : '13px 22px',
        fontFamily: FONT_LABEL, fontWeight: 700, fontSize: isMobile ? 13 : 14,
        letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
      }}
    >
      <Plus size={isMobile ? 18 : 19} strokeWidth={2.6} /> Today
    </button>
  )
}
