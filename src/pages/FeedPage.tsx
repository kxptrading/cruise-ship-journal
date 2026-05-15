// ─────────────────────────────────────────────────────────────────────────────
// sections/Feed.tsx — Social-style voyage feed (home screen)
//
// This file owns layout and voyage-progress calculations only.
// All data-fetching lives in hooks/useFeedData.ts.
// Sub-components:
//   feed/VoyageHero.tsx    — hero banner
//   features/voyages/VoyageMetrics.tsx   — quick-stat cards
//   feed/QuickComposer.tsx — inline log composer
//   feed/PostCard.tsx      — individual post card
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY2, WHITE, BORDER, MUTED, TEAL, sty, FONT_DISPLAY, FONT_BODY, BP } from '../constants'
import FE from '../components/FE'
import { useW, useVoyageId, useUserId } from '../context'
import { getTimeOfDay } from '../lib/atmosphere'
import { useFeedData } from '../hooks/useFeedData'
import PostCard      from '@/features/posts/PostCard'
import VoyageHero   from '@/features/voyages/VoyageHero'
import QuickComposer from '@/features/posts/QuickComposer'
import VoyageMetrics from '@/features/voyages/VoyageMetrics'
import { SkeletonCard } from '../components/ui/skeleton'
import { STAGGER, FADE_UP } from '../lib/motion'
import type { Metric } from '@/features/voyages/VoyageMetrics'
import type { Voyage, ItineraryDay, DailyLog, Budget, Packing, FoodLog, DiningEntry, FeedAuthor } from '../types'
import type { TimeOfDay } from '../lib/atmosphere'
import type { MotionValue } from 'framer-motion'

interface Star {
  id:       number | string
  x:        number
  y:        number
  size:     number
  delay:    number
  duration: number
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

export default function Feed({ voyage, itinerary, dailyLogs, budget, sectionStatus, onChange, onNav, showToast, onViewDay, onViewProfile, scrollY }: Props) {
  const w        = useW()
  const voyageId = useVoyageId()
  const userId   = useUserId()

  // ── Feed data (profiles, friend posts, photos, reactions, comments) ───────────
  const {
    avatarUrl, userInitials, userDisplayName,
    feedItems,
    reactionsMap, commentsMap,
    handleReact, handleAddComment, handleEditComment,
    reload,
  } = useFeedData({ userId, voyageId, dailyLogs, itinerary, voyage })

  // ── Infinite scroll ───────────────────────────────────────────────────────────
  const [displayCount, setDisplayCount] = useState(12)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayCount < feedItems.length) {
        setDisplayCount(c => c + 8)
      }
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [displayCount, feedItems.length])

  const visibleItems = feedItems.slice(0, displayCount)
  const hasMore = displayCount < feedItems.length

  // ── Pull-to-refresh ───────────────────────────────────────────────────────────
  const [pullState,  setPullState]  = useState<'idle' | 'pulling' | 'refreshing'>('idle')
  const [pullDist,   setPullDist]   = useState(0)
  const touchStartY = useRef(0)
  const feedRef     = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const main = document.querySelector('main')
    if (main && main.scrollTop > 8) return
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartY.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setPullDist(Math.min(delta, 90))
    if (delta > 4) setPullState('pulling')
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (pullDist > 65) {
      setPullState('refreshing')
      setPullDist(0)
      await new Promise(r => window.setTimeout(r, 200))
      reload()
      await new Promise(r => window.setTimeout(r, 600))
    }
    setPullState('idle')
    setPullDist(0)
    touchStartY.current = 0
  }, [pullDist, reload])

  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

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

  // ── Metric card data ──────────────────────────────────────────────────────────
  const nights    = parseInt(voyage.totalNights) || itinerary.length || 0
  const ports     = itinerary.filter(d => d.port && d.port.trim() && d.port.toLowerCase() !== 'at sea').length
  const logged    = dailyLogs.filter(d => d.highlights || d.bestMoment).length
  const spent     = (budget.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budgetAmt = parseFloat(String(budget.budget)) || 0
  const budgetOver = budgetAmt > 0 && spent > budgetAmt
  const completedCount = sectionStatus?.size || 0
  const totalSections  = 12

  const metrics: Metric[] = [
    { icon: '📖', value: nights > 0 ? `${logged} / ${nights}` : logged > 0 ? String(logged) : '—', label: 'Days Logged',     color: NAVY2,                                                nav: 'daily' },
    { icon: '📍', value: ports > 0 ? String(ports) : '—',                                          label: 'Ports',            color: TEAL,                                                 nav: 'itinerary' },
    { icon: '💳', value: spent > 0 ? `£${spent.toFixed(0)}` : '£—',                               label: budgetOver ? 'Over Budget!' : 'Spent', color: budgetOver ? '#DC2626' : TEAL,   nav: 'budget' },
    { icon: '🏆', value: `${completedCount} / ${totalSections}`,                                   label: 'Journal Complete', color: completedCount === totalSections ? '#22C55E' : NAVY2,  nav: 'highlights' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div ref={feedRef}>
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(pullState === 'pulling' || pullState === 'refreshing') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: pullState === 'refreshing' ? 44 : Math.max(0, (pullDist / 90) * 44) }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
              {pullState === 'refreshing'
                ? <><span style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block' }}>⟳</span> Refreshing…</>
                : `${pullDist > 65 ? 'Release' : 'Pull'} to refresh`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VoyageHero
        w={w} voyage={voyage} voyagePct={voyagePct} currentDay={currentDay}
        voyageNights={voyageNights} daysLeft={daysLeft} barPct={barPct}
        timeOfDay={timeOfDay} stars={stars} onNav={onNav} scrollY={scrollY}
        itinerary={itinerary}
      />

      <VoyageMetrics metrics={metrics} onNav={onNav} />

      {dailyLogs.length > 0 && (
        <QuickComposer
          dailyLogs={dailyLogs}
          itinerary={itinerary}
          voyageId={voyageId}
          userId={userId}
          currentDay={currentDay}
          onChange={onChange}
          showToast={showToast}
          avatarUrl={avatarUrl || undefined}
          initials={userInitials}
        />
      )}

      {feedItems.length === 0 ? (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: w < BP.mobile ? '40px 20px' : '56px 32px', textAlign: 'center' }}>
          <div style={{ marginBottom: 14 }}><FE emoji="🌊" size={48} /></div>
          <div style={{ fontSize: 24, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Your voyage feed is empty</div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 'min(380px, 100%)', margin: '0 auto 24px' }}>
            {dailyLogs.length === 0
              ? 'Add your first day in the Daily Log, then come back here to post your highlights.'
              : "You've got days added — write some highlights and they'll appear here as posts."}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNav('daily')} className="btn-primary" style={{ ...sty.btn, fontSize: 13, padding: '9px 20px' }}>Open Daily Log →</button>
            {dailyLogs.length === 0 && (
              <button onClick={() => onNav('itinerary')} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>Set Up Itinerary</button>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {visibleItems.map((item, i) => (
            <motion.div key={`${item.voyageId}-${item.dayNumber}-${i}`} variants={FADE_UP} layout="position">
              <PostCard
                item={item}
                onViewDay={item.author ? undefined : onViewDay}
                avatarUrl={avatarUrl}
                initials={userInitials}
                displayName={userDisplayName}
                author={item.author}
                onViewProfile={item.author ? () => onViewProfile?.(item.author!) : undefined}
                reactions={reactionsMap[`${item.voyageId}-${item.dayNumber}`] || {}}
                onReact={(rid: string) => handleReact(item.voyageId, item.dayNumber, rid)}
                comments={commentsMap[`${item.voyageId}-${item.dayNumber}`] || []}
                onAddComment={(body: string) => handleAddComment(item.voyageId, item.dayNumber, body)}
                onEditComment={handleEditComment}
                userId={userId ?? undefined}
              />
            </motion.div>
          ))}

          {/* Infinite scroll sentinel + skeleton placeholders */}
          {hasMore && (
            <div ref={sentinelRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!hasMore && feedItems.length > 0 && (
            <motion.div variants={FADE_UP} style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <button onClick={() => onNav('daily')} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>
                Open Daily Log for full details →
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
