// ─────────────────────────────────────────────────────────────────────────────
// pages/VoyageDetailPage.tsx — Voyage overview + journal tabs (spec §4)
//
// ARCHITECTURE — DUAL DATA LAYER:
//   This page bridges the legacy useVoyageData hook and React Query.
//   • The voyage header (hero card) fetches its own data via useVoyage()
//     (React Query) — it only needs ship_name, dates, and cover_photo_url.
//   • The journal section tabs (DailyLog, FoodLog, etc.) receive `data` and
//     `update` as props from App.tsx, sourced from useVoyageData. These sections
//     will be migrated to self-fetching React Query hooks in future phases.
//   • The 'posts' tab (PostList) is fully React Query — it fetches independently.
//
// WHY PROPS FOR JOURNAL TABS?
//   Rebuilding all 11 legacy sections at once is too high risk. The prop-passing
//   bridge lets us deploy new pages incrementally while keeping the journal tabs
//   working without regression. Each section can be migrated independently.
//
// URL-DRIVEN TAB SELECTION:
//   The active tab is driven by the ?tab= query parameter, not by component state
//   alone. This means:
//     - Sidebar journal section links (e.g. "Food Log") navigate to
//       /voyages/:id?tab=food, opening the correct tab directly.
//     - Deep links and back-button navigation preserve the active tab.
//   On mount we read tabParam from searchParams; on subsequent navigations we
//   sync via a useEffect on tabParam.
//
// VOYAGE ID:
//   voyageId comes from useParams() — it is the URL segment, not from
//   useVoyageData. This means the page correctly shows the voyage from the URL
//   even if the user has a different activeVoyageId in localStorage.
//   (App.tsx handles syncing localStorage when the URL changes.)
//
// AGE GATE:
//   The Budget tab is filtered out when isAdult is false. isAdult comes from the
//   user's profile.age field in Supabase. See App.tsx for how it is derived.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY2, GOLD, TEAL, WHITE, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_BODY, sty, BP } from '@/constants'
import { useW, useUserId } from '@/context'
import { useVoyage } from '@/features/voyages/hooks'
import { supabase } from '@/lib/supabase'
import { exportJournalPdf } from '@/lib/voyageExport'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { FADE_UP } from '@/lib/motion'
import FE from '@/components/FE'
import { ArrowLeft, Plus, Download, Users } from 'lucide-react'
import JournalDock from '@/components/JournalDock'
import Badges from '@/sections/profile/Badges'
import CoAuthorsPanel from '@/features/voyages/CoAuthorsPanel'
import { useLeaveVoyage } from '@/features/voyages/coauthors'
import type { VoyageData } from '@/types'

import PostList       from '@/features/posts/PostList'

// Journal section components — lazy-loaded per-tab
// Each chunk is only downloaded when the user clicks the corresponding tab.
const DailyLog       = lazy(() => import('@/sections/dailylog/JournalEntry'))
const ItinerarySection = lazy(() => import('@/features/voyages/ItineraryEditor'))
const BudgetTracker  = lazy(() => import('@/sections/BudgetTracker'))
const FoodHub        = lazy(() => import('@/sections/food/FoodHub'))
const EntertainmentLog = lazy(() => import('@/sections/EntertainmentLog'))
const ShoppingLog    = lazy(() => import('@/sections/ShoppingLog'))
const Highlights     = lazy(() => import('@/sections/Highlights'))
const PackingList    = lazy(() => import('@/sections/PackingList'))
const Notes          = lazy(() => import('@/sections/notes/NotesBoard'))
const MemoryGallery  = lazy(() => import('@/features/voyages/MemoryGallery'))

// ── Tab definitions ───────────────────────────────────────────────────────────
// 'daily' (Daily Log) is the default/first tab — it's where "Open Journal" lands.

type Tab = 'voyage' | 'posts' | 'gallery' | 'daily' | 'itinerary' | 'budget' | 'food' | 'dining' |
           'entertainment' | 'foodfav' | 'shopping' | 'highlights' | 'packing' | 'notes' | 'badges'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'daily',         label: 'Daily Log',     emoji: '📅' },
  { id: 'posts',         label: 'Posts',         emoji: '📝' },
  { id: 'gallery',       label: 'Gallery',       emoji: '📸' },
  { id: 'itinerary',     label: 'Itinerary',     emoji: '🗺️' },
  { id: 'budget',        label: 'Budget',        emoji: '💳' },
  { id: 'food',          label: 'Food & Dining', emoji: '🍽️' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎭' },
  { id: 'shopping',      label: 'Shopping',      emoji: '🛍️' },
  { id: 'highlights',    label: 'Highlights',    emoji: '🏆' },
  { id: 'packing',       label: 'Packing',       emoji: '🧳' },
  { id: 'notes',         label: 'Notes',         emoji: '🗒️' },
  { id: 'badges',        label: 'Badges',        emoji: '🏅' },
]

// ── Props ─────────────────────────────────────────────────────────────────────
// data + update are passed down from App.tsx (useVoyageData) and forwarded to
// legacy section tabs. These props will be removed as sections are migrated.

interface Props {
  data:       VoyageData
  update:     (key: keyof VoyageData, val: VoyageData[keyof VoyageData]) => void
  onNav:      (section: string) => void
  showToast?: (msg: string) => void
  isAdult:    boolean
}

// ── Helper ────────────────────────────────────────────────────────────────────
// Appends 'T00:00:00' to prevent UTC-to-local date shift on date-only ISO strings.
function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoyageDetailPage({ data, update, showToast, isAdult }: Props) {
  const navigate         = useNavigate()
  // voyageId from URL takes precedence over any active voyage in localStorage.
  // This is what enables direct links to a specific voyage to work correctly.
  const { voyageId }       = useParams<{ voyageId: string }>()
  const [searchParams]     = useSearchParams()
  const w                  = useW()
  const userId             = useUserId()

  // ── Per-voyage keepsake export ─────────────────────────────────────────────
  // Reuses the shared journal renderer, scoped to this voyage. Display name is
  // fetched on demand so the export carries the user's name on the cover.
  const [exporting, setExporting] = useState(false)
  const [showCoAuthors, setShowCoAuthors] = useState(false)
  const leaveVoyage = useLeaveVoyage()
  const handleExport = async () => {
    if (!userId || !voyageId || exporting) return
    setExporting(true)
    try {
      const { data: profile } = await supabase
        .from('profiles').select('display_name').eq('user_id', userId).maybeSingle()
      await exportJournalPdf(userId, profile?.display_name || 'My', { voyageId })
    } catch (e) {
      console.error('Voyage export failed:', e)
      showToast?.('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // ── Tab state — URL-driven ─────────────────────────────────────────────────
  // Initialise from ?tab= so sidebar journal links open the right section.
  // If the ?tab= param is missing or invalid, default to the posts view.
  const tabParam   = searchParams.get('tab') as Tab | null
  const validTabs  = new Set(TABS.map(t => t.id))
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && validTabs.has(tabParam) ? tabParam : 'daily'
  )
  // Swipe-to-turn-page: direction of the last tab change (for the slide). We detect
  // a swipe two ways so it works everywhere: pointer (touch/pen on tablets/phones)
  // and horizontal wheel (two-finger trackpad on laptops).
  const [swipeDir, setSwipeDir] = useState(0)
  const pointerRef = useRef<{ x: number; y: number; t: number; ignore: boolean } | null>(null)
  const wheelAccum = useRef(0)
  const wheelReset = useRef<number | undefined>(undefined)
  const lastNav    = useRef(0)

  // Sync activeTab when ?tab= changes (e.g. user clicks a different Sidebar link
  // while already on this page — the component doesn't remount, only the URL updates).
  useEffect(() => {
    if (tabParam && validTabs.has(tabParam)) setActiveTab(tabParam)
  }, [tabParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voyage header data from React Query ────────────────────────────────────
  // Only fetches columns needed for the hero card. The journal data is already
  // in `data` from useVoyageData (passed as props).
  const { data: voyageRow, isLoading } = useVoyage(voyageId)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!voyageRow) {
    return (
      <EmptyState
        icon="🔍"
        heading="Voyage not found"
        body="This voyage may have been deleted or doesn't exist."
        action={{ label: 'Back to Voyages', onClick: () => navigate('/voyages') }}
      />
    )
  }

  const title      = voyageRow.ship_name || 'Unnamed Voyage'
  const dateRange  = [formatDate(voyageRow.departure_date), formatDate(voyageRow.return_date)].filter(Boolean).join(' – ')

  // Ownership: a co-author (shared voyage) is an additive contributor — they can
  // add posts/photos but not edit the owner's journal sections or the voyage row.
  const isOwner = !!userId && voyageRow.user_id === userId

  // Tabs: everyone (owner + co-authors) gets the full journal; co-author writes are
  // now permitted by RLS and merge per-row. Budget stays gated to adults.
  const visibleTabs = TABS.filter(t => t.id !== 'budget' || isAdult)

  // Clamp the active tab to one the current user can actually see (e.g. a
  // co-author deep-linked to ?tab=daily falls back to Posts).
  const safeTab: Tab = visibleTabs.some(t => t.id === activeTab) ? activeTab : 'daily'

  // Turn to the adjacent section (like turning a page). delta +1 = next, -1 = prev.
  const goToTab = (delta: 1 | -1) => {
    const idx  = visibleTabs.findIndex(t => t.id === safeTab)
    const next = idx + delta
    if (idx < 0 || next < 0 || next >= visibleTabs.length) return
    setSwipeDir(delta)
    setActiveTab(visibleTabs[next].id)
  }

  const inIgnore = (el: EventTarget | null) => !!(el as HTMLElement)?.closest?.('[data-swipe-ignore]')

  // ── Touch / pen swipe (tablets, phones) ──────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') { pointerRef.current = null; return }  // mouse uses the dock
    pointerRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), ignore: inIgnore(e.target) }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = pointerRef.current
    pointerRef.current = null
    if (!s || s.ignore) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    // A swipe = mostly-horizontal travel past a distance threshold.
    if (Date.now() - s.t < 1200 && Math.abs(dx) > 55 && Math.abs(dx) > 1.3 * Math.abs(dy)) {
      goToTab(dx < 0 ? 1 : -1)
    }
  }

  // ── Trackpad horizontal swipe (laptops) ──────────────────────────────────────
  // Two-finger horizontal swipes arrive as wheel deltaX. Accumulate within a gesture
  // and turn the page once it passes a threshold, then cool down so one swipe = one turn.
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return  // vertical scroll — ignore
    if (inIgnore(e.target)) return
    const now = Date.now()
    if (now - lastNav.current < 600) return
    wheelAccum.current += e.deltaX
    window.clearTimeout(wheelReset.current)
    wheelReset.current = window.setTimeout(() => { wheelAccum.current = 0 }, 160)
    if (Math.abs(wheelAccum.current) > 90) {
      goToTab(wheelAccum.current > 0 ? 1 : -1)
      wheelAccum.current = 0
      lastNav.current = now
    }
  }

  return (
    <div>
      {/* ── Voyage header ─────────────────────────────────────────────────── */}
      <motion.div {...FADE_UP} initial="hidden" animate="visible">
        {/* Back + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <button
            onClick={() => navigate('/voyages')}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
          >
            <ArrowLeft size={15} /> My Voyages
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate(`/voyages/${voyageId}/posts/new`)}
              style={{ ...sty.btn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px', background: GOLD + 'EE', color: TEXT, boxShadow: 'none' }}
            >
              <Plus size={14} strokeWidth={2.5} /> New Post
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              title="Export this voyage as a printable keepsake"
              style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px', cursor: exporting ? 'default' : 'pointer', opacity: exporting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
            >
              <Download size={14} /> {exporting ? 'Preparing…' : 'Export'}
            </button>
            {isOwner ? (
              <button
                onClick={() => setShowCoAuthors(true)}
                title="Manage co-authors"
                style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
              >
                <Users size={14} /> Co-authors
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!voyageId) return
                  await leaveVoyage.mutateAsync(voyageId)
                  navigate('/voyages')
                }}
                title="Leave this shared voyage"
                style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
              >
                Leave
              </button>
            )}
          </div>
        </div>

        {/* Co-author hint for shared voyages */}
        {!isOwner && (
          <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, marginBottom: 12 }}>
            <Users size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />
            Shared voyage — you're a co-author and can edit the journal.
          </div>
        )}

        {/* Hero card — gradient background falls back to brand navy when no cover photo */}
        <div style={{
          borderRadius: 20, overflow: 'hidden', marginBottom: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, var(--t-primary-dk), var(--t-primary))',
          minHeight: 140, position: 'relative',
        }}>
          {voyageRow.cover_photo_url && (
            <img src={voyageRow.cover_photo_url} alt={title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {/* Gradient overlay ensures text is legible over bright cover photos */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }} />
          <div style={{ position: 'relative', padding: w < BP.mobile ? '24px 20px' : '28px 28px' }}>
            {voyageRow.cruise_line && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, marginBottom: 6 }}>
                {voyageRow.cruise_line}
              </div>
            )}
            <h1 style={{ margin: '0 0 8px', fontSize: w < BP.mobile ? 26 : 32, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1.1 }}>
              {title}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {dateRange && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  <FE emoji="📅" size={13} /> {dateRange}
                </span>
              )}
              {voyageRow.total_nights && (
                <span style={{ fontSize: 13, color: GOLD, fontWeight: 600 }}>
                  {voyageRow.total_nights} nights
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Dock (macOS-style, hover-magnifying) ───────────────────────────── */}
      <JournalDock tabs={visibleTabs} active={safeTab} onSelect={setActiveTab} mobile={w < BP.mobile} />

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      {/* Swipe left/right turns to the adjacent section (page-turn feel). The new
          section slides in from the swipe direction. */}
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerRef.current = null }}
        onWheel={onWheel}
        style={{ touchAction: 'pan-y' }}
      >
      <AnimatePresence mode="wait" custom={swipeDir}>
        <motion.div
          key={safeTab}
          custom={swipeDir}
          variants={{
            enter:  (d: number) => ({ opacity: 0, x: d >= 0 ? 36 : -36 }),
            center: { opacity: 1, x: 0 },
            exit:   (d: number) => ({ opacity: 0, x: d >= 0 ? -36 : 36 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Suspense fallback={<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><SkeletonCard /><SkeletonCard /></div>}>
            {/* 'posts' tab — fully React Query, self-fetching via PostList */}
            {safeTab ==='posts' && voyageId && (
              <PostList voyageId={voyageId} />
            )}
            {/* 'gallery' tab — memory gallery grouped by day / location */}
            {safeTab ==='gallery' && voyageId && (
              <MemoryGallery voyageId={voyageId} />
            )}
            {/* Legacy tabs — receive data + update from useVoyageData (via App.tsx props) */}
            {safeTab ==='daily'         && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} voyage={data.voyage} initialDay={0} />}
            {safeTab ==='itinerary'     && <ItinerarySection data={data.itinerary} onChange={v => update('itinerary', v)} />}
            {/* Budget tab is hidden unless isAdult is true (controlled by profile.age) */}
            {safeTab ==='budget'        && isAdult && <BudgetTracker data={data.budget} onChange={v => update('budget', v)} />}
            {safeTab ==='food'          && <FoodHub data={data} update={update} />}
            {safeTab ==='entertainment' && <EntertainmentLog data={data.entertainmentLog} onChange={v => update('entertainmentLog', v)} />}
            {safeTab ==='shopping'      && <ShoppingLog data={data.shopping} onChange={v => update('shopping', v)} />}
            {safeTab ==='highlights'    && <Highlights data={data.highlights} onChange={v => update('highlights', v)} />}
            {safeTab ==='packing'       && <PackingList data={data.packing} onChange={v => update('packing', v)} />}
            {safeTab ==='notes'         && <Notes data={data.notes} onChange={v => update('notes', v)} />}
            {safeTab ==='badges'        && voyageId && <Badges currentVoyage={{ id: voyageId, ship_name: data.voyage.shipName, total_nights: data.voyage.totalNights }} />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
      </div>

      {showCoAuthors && voyageId && (
        <CoAuthorsPanel voyageId={voyageId} onClose={() => setShowCoAuthors(false)} />
      )}
    </div>
  )
}
