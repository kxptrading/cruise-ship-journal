// ─────────────────────────────────────────────────────────────────────────────
// pages/VoyageDetailPage.tsx — Voyage overview + journal tabs (spec §4)
//
// Props passed from App.tsx give access to the existing data layer during the
// React Query migration. Journal section tabs use the legacy useVoyageData
// data until Phase 3-6 rebuild them as self-fetching pages.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, lazy, Suspense } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY2, GOLD, TEAL, WHITE, BORDER, MUTED, FONT_DISPLAY, FONT_BODY, sty, BP } from '@/constants'
import { useW } from '@/context'
import { useVoyage } from '@/features/voyages/hooks'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { FADE_UP } from '@/lib/motion'
import FE from '@/components/FE'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import type { VoyageData } from '@/types'

// Journal section components — lazy-loaded per-tab
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

// ── Tab definitions ───────────────────────────────────────────────────────────

type Tab = 'posts' | 'daily' | 'itinerary' | 'budget' | 'food' | 'dining' |
           'entertainment' | 'foodfav' | 'shopping' | 'highlights' | 'packing' | 'notes'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'posts',         label: 'Posts',         emoji: '📝' },
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

interface Props {
  data:       VoyageData
  update:     (key: keyof VoyageData, val: VoyageData[keyof VoyageData]) => void
  onNav:      (section: string) => void
  showToast?: (msg: string) => void
  isAdult:    boolean
}

// ── Helper ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoyageDetailPage({ data, update, showToast, isAdult }: Props) {
  const navigate         = useNavigate()
  const { voyageId }     = useParams<{ voyageId: string }>()
  const w                = useW()
  const [activeTab, setActiveTab] = useState<Tab>('posts')

  // Fetch voyage metadata from React Query (title, cover image, stats)
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
              style={{ ...sty.btn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px', background: GOLD + 'EE', color: '#1C2B3A', boxShadow: 'none' }}
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

        {/* Hero card */}
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
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: `1px solid ${BORDER}`, marginBottom: 20, scrollbarWidth: 'none', msOverflowStyle: 'none', position: 'relative' }}>
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background:  'none',
              border:      'none',
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
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Suspense fallback={<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><SkeletonCard /><SkeletonCard /></div>}>
            {activeTab === 'posts' && (
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
                <EmptyState
                  icon="📝"
                  heading="Posts coming in Phase 3"
                  body="Individual post creation with audience control (Private / Family / Public) will be built in the next phase."
                  action={{ label: 'Write in Daily Log instead', onClick: () => setActiveTab('daily') }}
                />
              </div>
            )}
            {activeTab === 'daily'         && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} voyage={data.voyage} initialDay={0} />}
            {activeTab === 'itinerary'     && <ItinerarySection data={data.itinerary} onChange={v => update('itinerary', v)} />}
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
