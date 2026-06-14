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

import { useState, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { NAVY2, WHITE, BORDER, MUTED, LIGHT, TEAL, GOLD, ROSE, PLUM, sty, FONT_BODY, FONT_DISPLAY, BP } from '../constants'
import { BookOpen, MapPin, Wallet, Star, UtensilsCrossed, Luggage, CheckCircle2, Anchor } from 'lucide-react'
import { useW, useVoyageId } from '../context'
import { getTimeOfDay } from '../lib/atmosphere'
import { STAGGER, FADE_UP, REVEAL } from '../lib/motion'
import { MetricCard } from '../components/ui/metric-card'
import VoyageHero       from '@/features/voyages/VoyageHero'
import BudgetBreakdown  from '@/features/voyages/dashboard/BudgetBreakdown'
import ItineraryTimeline from '@/features/voyages/dashboard/ItineraryTimeline'
import RecentPosts      from '@/features/voyages/dashboard/RecentPosts'
import MyVoyagesStrip  from '@/features/voyages/dashboard/MyVoyagesStrip'
import PhotoSummaryCard from '@/features/voyages/dashboard/PhotoSummaryCard'
import VoyageMemoryWall  from '@/features/voyages/dashboard/VoyageMemoryWall'
import HighlightsGallery from '@/features/voyages/dashboard/HighlightsGallery'
import { usePostsByVoyage } from '@/features/posts/hooks'
import { publicUrl } from '@/features/posts/mediaStorage'
import type { Voyage, ItineraryDay, DailyLog, Budget, Packing, FoodLog, DiningEntry, FeedAuthor } from '../types'
import type { TimeOfDay } from '../lib/atmosphere'
import type { MotionValue } from 'framer-motion'

// Lazy-load the heavy map (Leaflet bundle) so dashboard initial render is fast

interface Star {
  id: number; x: number; y: number; size: number; delay: number; duration: number
}

// ── Apple-style scroll choreography ──────────────────────────────────────────
// Each dashboard block rises into place as it enters the viewport.

function Reveal({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={REVEAL}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  )
}

// Large centered section header — eyebrow label over an oversized display title.

function SectionHeading({ eyebrow, title, sub, w }: { eyebrow: string; title: string; sub?: string; w: number }) {
  const mobile = w < BP.mobile
  return (
    <Reveal>
      <div style={{ textAlign: 'center', padding: mobile ? '28px 16px 18px' : '44px 24px 26px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: FONT_BODY, marginBottom: 8 }}>
          {eyebrow}
        </div>
        <h2 style={{ margin: 0, fontSize: mobile ? 22 : 30, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.15 }}>
          {title}
        </h2>
        {sub && (
          <p style={{ margin: '10px auto 0', maxWidth: 480, fontSize: mobile ? 13 : 15, color: MUTED, lineHeight: 1.6, fontFamily: FONT_BODY }}>
            {sub}
          </p>
        )}
      </div>
    </Reveal>
  )
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
  onSwitch?:      (id: string) => void
  showToast?:     (msg: string) => void
  onViewDay?:     (dayIndex: number) => void
  onViewProfile?: (author: FeedAuthor) => void
  scrollY?:       MotionValue<number>
}

export default function Dashboard({
  voyage, itinerary, dailyLogs, budget, packing, foodLogs, diningLog,
  sectionStatus, onNav, onSwitch, onViewDay, scrollY,
}: Props) {
  const w        = useW()
  const voyageId = useVoyageId()

  const { data: voyagePosts = [] } = usePostsByVoyage(voyageId)

  // Pick a random hero photo once when posts first load — changes on every page load
  const heroPickedRef  = useRef(false)
  const [heroPhotoUrl, setHeroPhotoUrl] = useState<string | undefined>()
  useEffect(() => {
    if (heroPickedRef.current || !voyagePosts.length) return
    const paths = voyagePosts.flatMap(p => p.media_paths ?? []).filter(Boolean)
    if (paths.length > 0) {
      heroPickedRef.current = true
      setHeroPhotoUrl(publicUrl(paths[Math.floor(Math.random() * paths.length)]))
    }
  }, [voyagePosts])

  // Map of date → resolved photo URL for ItineraryTimeline thumbnails
  const photosByDate = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const post of voyagePosts) {
      if (post.post_date && (post.media_paths ?? []).length > 0 && !map[post.post_date]) {
        map[post.post_date] = publicUrl(post.media_paths[0])
      }
    }
    return map
  }, [voyagePosts])

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
        itinerary={itinerary} heroPhotoUrl={heroPhotoUrl}
      />

      {/* Apple-style statement — sets the tone before the content blocks */}
      {(voyage.shipName || voyage.departureDate) && (
        <SectionHeading
          w={w}
          eyebrow="Deck Days"
          title="Every day at sea. Beautifully remembered."
          sub="Your photos, ports, meals and moments — gathered into one living journal of the voyage."
        />
      )}

      {/* My voyages quick-nav strip */}
      <Reveal>
        <MyVoyagesStrip currentVoyageId={voyageId} onSwitch={onSwitch} />
      </Reveal>

      {/* Budget breakdown (only when there's spending data) */}
      {spent > 0 && (
        <Reveal>
          <BudgetBreakdown budget={budget} />
        </Reveal>
      )}

      {/* Memories captured — visual anchor above stats */}
      <Reveal>
        <PhotoSummaryCard voyageId={voyageId} onViewGallery={() => onNav('gallery')} />
      </Reveal>

      {/* Voyage highlights — auto-curated best-of categories */}
      {voyageId && (
        <Reveal>
          <HighlightsGallery voyageId={voyageId} />
        </Reveal>
      )}

      {/* Metric cards */}
      {(voyage.shipName || voyage.departureDate) && (
        <SectionHeading w={w} eyebrow="By the numbers" title="Your voyage at a glance." />
      )}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '0px 0px -60px 0px' }}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: w < BP.mobile ? 10 : 14, marginBottom: 16 }}
      >
        <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('daily')}>
          <MetricCard
            icon={<BookOpen size={20} strokeWidth={1.8} />}
            value={nights > 0 ? `${logged} / ${nights}` : logged > 0 ? String(logged) : '—'}
            label="Days Logged"
            color={NAVY2}
            sparkline={logSparkline.some(v => v) ? logSparkline : undefined}
          />
        </motion.div>

        <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('itinerary')}>
          <MetricCard
            icon={<MapPin size={20} strokeWidth={1.8} />}
            value={ports > 0 ? String(ports) : '—'}
            label="Ports"
            color={TEAL}
          />
        </motion.div>

        <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('budget')}>
          <MetricCard
            icon={<Wallet size={20} strokeWidth={1.8} />}
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
            icon={<Star size={20} strokeWidth={1.8} />}
            value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
            label="Avg Rating"
            sub={ratingsArr.length > 0 ? `${ratingsArr.length} day${ratingsArr.length !== 1 ? 's' : ''} rated` : undefined}
            color={GOLD}
            sparkline={ratingSparkline.some(v => v) ? ratingSparkline : undefined}
          />
        </motion.div>

        {w >= BP.mobile && (
          <>
            <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('food')}>
              <MetricCard
                icon={<UtensilsCrossed size={20} strokeWidth={1.8} />}
                value={diningCount > 0 ? String(diningCount) : '—'}
                label="Dining Entries"
                color={ROSE}
              />
            </motion.div>

            <motion.div variants={FADE_UP} style={{ cursor: 'pointer' }} onClick={() => onNav('packing')}>
              <MetricCard
                icon={<Luggage size={20} strokeWidth={1.8} />}
                value={totalPackingItems > 0 ? String(totalPackingItems) : '—'}
                label="Items Packed"
                color={PLUM}
              />
            </motion.div>

            <motion.div variants={FADE_UP} style={{ cursor: 'pointer', gridColumn: 'span 2' }} onClick={() => onNav('highlights')}>
              <MetricCard
                icon={<CheckCircle2 size={20} strokeWidth={1.8} />}
                value={`${completedCount} / ${totalSections}`}
                label="Journal Complete"
                color={completedCount === totalSections ? TEAL : NAVY2}
                pct={Math.round((completedCount / totalSections) * 100)}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Voyage Memory Wall — masonry photo grid */}
      {voyageId && (
        <Reveal>
          <VoyageMemoryWall voyageId={voyageId} limit={16} onViewAll={() => onNav('gallery')} />
        </Reveal>
      )}

      {/* Itinerary timeline */}
      <Reveal>
        <ItineraryTimeline
          itinerary={itinerary}
          dailyLogs={dailyLogs}
          currentDay={currentDay}
          photosByDate={photosByDate}
          onViewDay={dayIdx => {
            if (onViewDay) onViewDay(dayIdx)
            else onNav('daily')
          }}
        />
      </Reveal>

      {/* Recent posts */}
      <Reveal>
        <RecentPosts
          dailyLogs={dailyLogs}
          itinerary={itinerary}
          onNav={onNav}
          onViewDay={onViewDay}
        />
      </Reveal>

      {/* Empty state — no voyage set up */}
      {!voyage.shipName && !voyage.departureDate && (
        <Reveal>
          <div style={{ background: WHITE, borderRadius: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)', padding: w < BP.mobile ? '48px 24px' : '64px 40px', textAlign: 'center', marginTop: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: LIGHT, border: `1px solid ${BORDER}`, color: NAVY2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
              <Anchor size={30} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: w < BP.mobile ? 24 : 32, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.15, marginBottom: 10 }}>
              Your voyage awaits.
            </div>
            <div style={{ fontSize: w < BP.mobile ? 13 : 15, color: MUTED, lineHeight: 1.7, maxWidth: 'min(440px, 100%)', margin: '0 auto 26px', fontFamily: FONT_BODY }}>
              Set up your voyage details to unlock the dashboard — itinerary timeline, budget breakdown, ports map, and more.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => onNav('voyage')} className="btn-primary" style={{ ...sty.btn, fontSize: 14, padding: '12px 28px', borderRadius: 980 }}>
                Set Up Voyage →
              </button>
              <button onClick={() => onNav('feed')} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 980, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontFamily: FONT_BODY, fontWeight: 600, color: MUTED }}>
                View Feed
              </button>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  )
}
