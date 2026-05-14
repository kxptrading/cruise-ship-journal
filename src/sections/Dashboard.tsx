// ─────────────────────────────────────────────────────────────────────────────
// sections/Dashboard.tsx — Interactive voyage overview (Phase 4)
//
// Sub-components:
//   feed/VoyageHero.tsx          — hero banner with interactive progress tooltip
//   dashboard/BudgetBreakdown.tsx — animated stacked spend bar
//   dashboard/ItineraryTimeline.tsx — horizontal scroll-snap day cards
//   dashboard/PortsMap.tsx       — route map (lazy-loaded)
//   dashboard/RecentPosts.tsx    — 3-up recent log cards
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { NAVY2, WHITE, BORDER, MUTED, TEAL, sty, FONT_BODY, BP } from '../constants'
import { useW, useVoyageId } from '../context'
import { getTimeOfDay } from '../lib/atmosphere'
import { STAGGER, FADE_UP } from '../lib/motion'
import { MetricCard } from '../components/ui/metric-card'
import VoyageHero       from './feed/VoyageHero'
import BudgetBreakdown  from './dashboard/BudgetBreakdown'
import ItineraryTimeline from './dashboard/ItineraryTimeline'
import RecentPosts      from './dashboard/RecentPosts'
import FE from '../components/FE'
import type { Voyage, ItineraryDay, DailyLog, Budget, Packing, FoodLog, DiningEntry, FeedAuthor } from '../types'
import type { TimeOfDay } from '../lib/atmosphere'
import type { MotionValue } from 'framer-motion'

// Lazy-load the heavy map so dashboard initial render is fast
const PortsMap = lazy(() => import('./dashboard/PortsMap'))

interface Star {
  id: number; x: number; y: number; size: number; delay: number; duration: number
}

interface Props {
  voyage:         Voyage
  itinerary:      ItineraryDay[]
  dailyLogs:      DailyLog[]
  budget:         Budget
  packing:        Packing
  foodLogs:       FoodLog[]
  diningLog:      DiningEntry[]
  sectionStatus?: Set<string>
  onChange:       (updated: DailyLog[]) => void
  onNav:          (section: string) => void
  showToast?:     (msg: string) => void
  onViewDay?:     (dayIndex: number) => void
  onViewProfile?: (author: FeedAuthor) => void
  scrollY?:       MotionValue<number>
}

export default function Dashboard({
  voyage, itinerary, dailyLogs, budget, packing, foodLogs, diningLog,
  sectionStatus, onNav, onViewDay, scrollY,
}: Props) {
  const w        = useW()
  const voyageId = useVoyageId()

  // ── Time of day + stars ───────────────────────────────────────────────────────
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay)
  useEffect(() => {
    const t = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000)
    return () => clearInterval(t)
  }, [])

  const stars = useMemo<Star[]>(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 85,
      size: Math.random() * 2.5 + 0.8, delay: Math.random() * 4, duration: Math.random() * 2.5 + 1.8,
    })), []
  )

  // ── Voyage progress ───────────────────────────────────────────────────────────
  const voyageNights = parseInt(voyage.totalNights) || 0
  const today        = new Date()
  const depDate      = voyage.departureDate ? new Date(voyage.departureDate) : null
  const rawDay       = (depDate && voyageNights > 0) ? Math.floor((today.getTime() - depDate.getTime()) / 86400000) + 1 : null
  const voyageOver   = rawDay !== null && rawDay > voyageNights
  const currentDay   = rawDay !== null ? Math.max(1, Math.min(voyageNights, rawDay)) : null
  const voyagePct    = rawDay !== null ? (voyageOver ? 100 : Math.round((currentDay! / voyageNights) * 100)) : null
  const daysLeft     = voyageOver ? 0 : (currentDay ? Math.max(0, voyageNights - currentDay) : 0)

  const [barPct, setBarPct] = useState<number>(0)
  useEffect(() => {
    const t = window.setTimeout(() => setBarPct(voyagePct || 0), 120)
    return () => window.clearTimeout(t)
  }, [voyagePct])

  // ── Metric computations ───────────────────────────────────────────────────────
  const nights  = parseInt(voyage.totalNights) || itinerary.length || 0
  const ports   = itinerary.filter(d => d.port && d.port.trim() && !d.port.toLowerCase().includes('sea')).length
  const logged  = dailyLogs.filter(d => d.highlights || d.bestMoment).length
  const spent   = (budget.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budgetAmt   = parseFloat(String(budget.budget)) || 0
  const budgetOver  = budgetAmt > 0 && spent > budgetAmt
  const budgetPct   = budgetAmt > 0 ? Math.round((spent / budgetAmt) * 100) : undefined

  const diningCount = foodLogs.length + diningLog.length
  const ratingsArr  = dailyLogs.filter(d => d.rating > 0).map(d => d.rating)
  const avgRating   = ratingsArr.length ? ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length : 0

  const totalPackingItems = Object.values(packing).flat().length

  const completedCount = sectionStatus?.size || 0
  const totalSections  = 12

  // ── Sparklines ────────────────────────────────────────────────────────────────
  const logSparkline = dailyLogs.map(d => (d.highlights || d.bestMoment ? 1 : 0))

  const dateToSpend = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of budget.items || []) {
      if (item.date) map.set(item.date, (map.get(item.date) || 0) + (parseFloat(item.amount) || 0))
    }
    return map
  }, [budget.items])

  const spendSparkline = dailyLogs.map((d, i) => {
    const date = d.date || itinerary[i]?.date || ''
    return dateToSpend.get(date) || 0
  })

  const ratingSparkline = dailyLogs.map(d => d.rating || 0)

  // ── Render ────────────────────────────────────────────────────────────────────
  const cols = w < BP.mobile ? 2 : 4

  return (
    <div>
      {/* Hero */}
      <VoyageHero
        w={w} voyage={voyage} voyagePct={voyagePct} currentDay={currentDay}
        voyageNights={voyageNights} daysLeft={daysLeft} barPct={barPct}
        timeOfDay={timeOfDay} stars={stars} onNav={onNav} scrollY={scrollY}
        itinerary={itinerary}
      />

      {/* Metric cards */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, marginBottom: 16 }}
      >
        <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('daily')}>
          <MetricCard
            icon="📖"
            value={nights > 0 ? `${logged} / ${nights}` : logged > 0 ? String(logged) : '—'}
            label="Days Logged"
            color={NAVY2}
            sparkline={logSparkline.some(v => v) ? logSparkline : undefined}
          />
        </motion.div>

        <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('itinerary')}>
          <MetricCard
            icon="📍"
            value={ports > 0 ? String(ports) : '—'}
            label="Ports"
            color={TEAL}
          />
        </motion.div>

        <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('budget')}>
          <MetricCard
            icon="💳"
            value={spent > 0 ? `£${spent.toFixed(0)}` : '£—'}
            label={budgetOver ? 'Over Budget!' : 'Total Spent'}
            sub={budgetAmt > 0 ? `of £${budgetAmt.toFixed(0)}` : undefined}
            color={budgetOver ? '#DC2626' : TEAL}
            pct={budgetPct !== undefined ? Math.min(budgetPct, 100) : undefined}
            alert={budgetOver}
            sparkline={spendSparkline.some(v => v) ? spendSparkline : undefined}
          />
        </motion.div>

        <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('daily')}>
          <MetricCard
            icon="⭐"
            value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
            label="Avg Rating"
            sub={ratingsArr.length > 0 ? `${ratingsArr.length} day${ratingsArr.length !== 1 ? 's' : ''} rated` : undefined}
            color="#F59E0B"
            sparkline={ratingSparkline.some(v => v) ? ratingSparkline : undefined}
          />
        </motion.div>

        {w >= BP.mobile && (
          <>
            <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('food')}>
              <MetricCard
                icon="🍽️"
                value={diningCount > 0 ? String(diningCount) : '—'}
                label="Dining Entries"
                color="#F97316"
              />
            </motion.div>

            <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('packing')}>
              <MetricCard
                icon="🧳"
                value={totalPackingItems > 0 ? String(totalPackingItems) : '—'}
                label="Items Packed"
                color="#8B5CF6"
              />
            </motion.div>

            <motion.div variants={FADE_UP} style={{ cursor: 'pointer', gridColumn: 'span 2' }} onClick={() => onNav('highlights')}>
              <MetricCard
                icon="🏆"
                value={`${completedCount} / ${totalSections}`}
                label="Journal Complete"
                color={completedCount === totalSections ? '#22C55E' : NAVY2}
                pct={Math.round((completedCount / totalSections) * 100)}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Budget breakdown (only when there's spending data) */}
      {spent > 0 && <BudgetBreakdown budget={budget} />}

      {/* Itinerary timeline */}
      <ItineraryTimeline
        itinerary={itinerary}
        dailyLogs={dailyLogs}
        currentDay={currentDay}
        onViewDay={dayIdx => {
          if (onViewDay) onViewDay(dayIdx)
          else onNav('daily')
        }}
      />

      {/* Ports map — lazy loaded */}
      {itinerary.some(d => d.port && !d.port.toLowerCase().includes('sea')) && (
        <Suspense fallback={
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>Loading map…</div>
            </div>
          </div>
        }>
          <PortsMap itinerary={itinerary} />
        </Suspense>
      )}

      {/* Recent posts */}
      <RecentPosts
        dailyLogs={dailyLogs}
        itinerary={itinerary}
        onNav={onNav}
        onViewDay={onViewDay}
      />

      {/* Empty state — no voyage set up */}
      {!voyage.shipName && !voyage.departureDate && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: w < BP.mobile ? '40px 20px' : '56px 32px', textAlign: 'center', marginTop: 16 }}>
          <div style={{ marginBottom: 14 }}><FE emoji="🌊" size={48} /></div>
          <div style={{ fontSize: 24, fontWeight: 400, color: NAVY2, fontFamily: "'Fredoka One', cursive", marginBottom: 8 }}>
            Your voyage awaits
          </div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 'min(380px, 100%)', margin: '0 auto 24px', fontFamily: FONT_BODY }}>
            Set up your voyage details to unlock the dashboard — itinerary timeline, budget breakdown, ports map, and more.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNav('voyage')} className="btn-primary" style={{ ...sty.btn, fontSize: 13, padding: '9px 20px' }}>
              Set Up Voyage →
            </button>
            <button onClick={() => onNav('feed')} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>
              View Feed
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
