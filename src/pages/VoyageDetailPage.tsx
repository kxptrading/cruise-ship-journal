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

import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY2, GOLD, TEAL, WHITE, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_BODY, sty, BP } from '@/constants'
import { useW } from '@/context'
import { useVoyage } from '@/features/voyages/hooks'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { FADE_UP } from '@/lib/motion'
import FE from '@/components/FE'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import type { VoyageData } from '@/types'

import PostList       from '@/features/posts/PostList'

// Journal section components — lazy-loaded per-tab
// Each chunk is only downloaded when the user clicks the corresponding tab.
const VoyageForm     = lazy(() => import('@/features/voyages/VoyageForm'))
const DailyLog       = lazy(() => import('@/sections/DailyLog'))
const ItinerarySection = lazy(() => import('@/features/voyages/ItineraryEditor'))
const BudgetTracker  = lazy(() => import('@/sections/BudgetTracker'))
const FoodLog        = lazy(() => import('@/sections/FoodLog'))
const DiningLog      = lazy(() => import('@/sections/DiningLog'))
const EntertainmentLog = lazy(() => import('@/sections/EntertainmentLog'))
const FoodFavourites = lazy(() => import('@/sections/FoodFavourites'))
const ShoppingLog    = lazy(() => import('@/sections/ShoppingLog'))
const Highlights     = lazy(() => import('@/sections/Highlights'))
const PackingList    = lazy(() => import('@/sections/PackingList'))
const Notes          = lazy(() => import('@/sections/Notes'))
const MemoryGallery  = lazy(() => import('@/features/voyages/MemoryGallery'))

// ── Tab definitions ───────────────────────────────────────────────────────────
// 'posts' is the default tab (index view). Journal sections and voyage details follow.

type Tab = 'voyage' | 'posts' | 'gallery' | 'daily' | 'itinerary' | 'budget' | 'food' | 'dining' |
           'entertainment' | 'foodfav' | 'shopping' | 'highlights' | 'packing' | 'notes'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'voyage',        label: 'Details',       emoji: '🚢' },
  { id: 'posts',         label: 'Posts',         emoji: '📝' },
  { id: 'gallery',       label: 'Gallery',       emoji: '📸' },
  { id: 'daily',         label: 'Daily Log',     emoji: '📅' },
  { id: 'itinerary',     label: 'Itinerary',     emoji: '🗺️' },
  { id: 'budget',        label: 'Budget',        emoji: '💳' },
  { id: 'food',          label: 'Food Log',      emoji: '🍽️' },
  { id: 'dining',        label: 'Dining',        emoji: '🍴' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎭' },
  { id: 'foodfav',       label: 'Favourites',    emoji: '💛' },
  { id: 'shopping',      label: 'Shopping',      emoji: '🛍️' },
  { id: 'highlights',    label: 'Highlights',    emoji: '🏆' },
  { id: 'packing',       label: 'Packing',       emoji: '🧳' },
  { id: 'notes',         label: 'Notes',         emoji: '📓' },
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

  // ── Tab state — URL-driven ─────────────────────────────────────────────────
  // Initialise from ?tab= so sidebar journal links open the right section.
  // If the ?tab= param is missing or invalid, default to the posts view.
  const tabParam   = searchParams.get('tab') as Tab | null
  const validTabs  = new Set(TABS.map(t => t.id))
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && validTabs.has(tabParam) ? tabParam : 'posts'
  )

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
  // Remove the Budget tab for underage users — spend data is adult content only.
  const visibleTabs = TABS.filter(t => t.id !== 'budget' || isAdult)

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
              onClick={() => navigate(`/voyages/${voyageId}/edit`)}
              style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
            >
              <Pencil size={14} /> Edit
            </button>
          </div>
        </div>

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

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      {/* scrollbarWidth: 'none' hides the tab bar scrollbar on mobile while
          keeping the overflow-x: auto functional for swipe scrolling. */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: `1px solid ${BORDER}`, marginBottom: 20, scrollbarWidth: 'none', msOverflowStyle: 'none', position: 'relative' }}>
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background:  'none',
              border:      'none',
              // marginBottom: -1 lets the active tab's bottom border overlap the container
              // border, creating the classic "selected tab" visual.
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--t-primary)' : 'transparent'}`,
              padding:     w < BP.mobile ? '10px 10px' : '10px 16px',
              cursor:      'pointer',
              fontFamily:  FONT_BODY,
              fontSize:    w < BP.mobile ? 11 : 13,
              fontWeight:  activeTab === tab.id ? 700 : 400,
              color:       activeTab === tab.id ? 'var(--t-primary)' : MUTED,
              display:     'flex',
              flexDirection: 'column',
              alignItems:  'center',
              gap:         3,
              flexShrink:  0,
              whiteSpace:  'nowrap',
              transition:  'color 0.15s, border-color 0.15s',
              marginBottom: -1,
            }}
          >
            <span style={{ fontSize: 16 }}>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      {/* AnimatePresence mode="wait" ensures the exiting tab content fades out
          before the entering tab fades in, preventing visual overlap. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Suspense fallback={<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><SkeletonCard /><SkeletonCard /></div>}>
            {/* 'voyage' tab — Voyage Details form (default landing tab) */}
            {activeTab === 'voyage' && (
              <VoyageForm data={data.voyage} onChange={v => update('voyage', v)} />
            )}
            {/* 'posts' tab — fully React Query, self-fetching via PostList */}
            {activeTab === 'posts' && voyageId && (
              <PostList voyageId={voyageId} />
            )}
            {/* 'gallery' tab — memory gallery grouped by day / location */}
            {activeTab === 'gallery' && voyageId && (
              <MemoryGallery voyageId={voyageId} />
            )}
            {/* Legacy tabs — receive data + update from useVoyageData (via App.tsx props) */}
            {activeTab === 'daily'         && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} voyage={data.voyage} initialDay={0} />}
            {activeTab === 'itinerary'     && <ItinerarySection data={data.itinerary} onChange={v => update('itinerary', v)} />}
            {/* Budget tab is hidden unless isAdult is true (controlled by profile.age) */}
            {activeTab === 'budget'        && isAdult && <BudgetTracker data={data.budget} onChange={v => update('budget', v)} />}
            {activeTab === 'food'          && <FoodLog data={data.foodLogs} onChange={v => update('foodLogs', v)} />}
            {activeTab === 'dining'        && <DiningLog data={data.diningLog} onChange={v => update('diningLog', v)} />}
            {activeTab === 'entertainment' && <EntertainmentLog data={data.entertainmentLog} onChange={v => update('entertainmentLog', v)} />}
            {activeTab === 'foodfav'       && <FoodFavourites data={data.foodFav} onChange={v => update('foodFav', v)} />}
            {activeTab === 'shopping'      && <ShoppingLog data={data.shopping} onChange={v => update('shopping', v)} />}
            {activeTab === 'highlights'    && <Highlights data={data.highlights} onChange={v => update('highlights', v)} />}
            {activeTab === 'packing'       && <PackingList data={data.packing} onChange={v => update('packing', v)} />}
            {activeTab === 'notes'         && <Notes data={data.notes} onChange={v => update('notes', v)} />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
