// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/JournalFab.tsx — persistent "Journal" button
//
// Replaces the old "＋ Today" quick-add FAB. It resolves the most relevant voyage
// (currently sailing → else nearest by date) and, on tap, opens that voyage as a
// scrapbook book (JournalBook overlay) with a book-opening animation. With no
// voyages yet, it routes to the voyages hub.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useVoyages, type VoyageRow } from '../voyages/hooks'
import { GOLD, NAVY2, FONT_LABEL } from '../../constants'
import JournalBook from './JournalBook'

const MS_DAY = 86_400_000

// Pick the most relevant voyage to open: currently sailing (today within the
// window) wins; otherwise the nearest by date; else the first.
function resolveCurrentVoyage(voyages: VoyageRow[]): string | null {
  if (!voyages.length) return null
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const t = startOfToday.getTime()
  const toDate = (s: string | null) => {
    if (!s) return null
    const d = new Date(s + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  }

  let best: { id: string; dist: number } | null = null
  for (const v of voyages) {
    const dep = toDate(v.departure_date)
    let dist: number
    if (dep) {
      const ret = toDate(v.return_date) ?? new Date(dep.getTime() + (v.total_nights ?? 0) * MS_DAY)
      dist = t >= dep.getTime() && t <= ret.getTime()
        ? 0
        : Math.min(Math.abs(t - dep.getTime()), Math.abs(t - ret.getTime()))
    } else {
      dist = Number.MAX_SAFE_INTEGER
    }
    if (!best || dist < best.dist) best = { id: v.id, dist }
  }
  return best?.id ?? voyages[0].id
}

export default function JournalFab({ isMobile }: { isMobile: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: voyages = [] } = useVoyages()
  const [openId, setOpenId] = useState<string | null>(null)

  // Which voyage to open, most-specific first:
  //   1. the voyage in the current URL (/voyages/:id/…) — what you're looking at
  //   2. the app's last active voyage (csj-activeVoyageId), set when you open one
  //   3. else the most relevant by date (currently sailing → nearest)
  const resolveOpenId = (): string | null => {
    const urlId = location.pathname.match(/^\/voyages\/([^/]+)/)?.[1]
    if (urlId && urlId !== 'new' && voyages.some(v => v.id === urlId)) return urlId
    const active = localStorage.getItem('csj-activeVoyageId')
    if (active && voyages.some(v => v.id === active)) return active
    return resolveCurrentVoyage(voyages)
  }

  const open = () => {
    const id = resolveOpenId()
    if (!id) { navigate('/voyages'); return }
    setOpenId(id)
  }

  return (
    <>
      <button
        onClick={open}
        aria-label="Open your voyage journal"
        title="Open your voyage journal"
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
        <BookOpen size={isMobile ? 18 : 19} strokeWidth={2.4} /> Journal
      </button>

      {openId && <JournalBook voyageId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
