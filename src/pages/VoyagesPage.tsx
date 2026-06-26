// ─────────────────────────────────────────────────────────────────────────────
// pages/VoyagesPage.tsx — My Voyages list (spec §4: /voyages)
//
// SELF-FETCHING PAGE:
//   All data is fetched via React Query hooks — no props from App.tsx required.
//   useVoyages() returns the user's voyage list; useVoyagePostCounts() fetches
//   post counts for the badge on each VoyageCard.
//
// TWO-PHASE LOAD:
//   Voyages are fetched first. Once voyage ids are known, post counts are fetched
//   in a second query. This is intentional — showing the voyage cards immediately
//   (even without counts) is better UX than waiting for both queries in parallel
//   before rendering anything.
//
// COLUMN SELECTION:
//   useVoyages() selects only the columns needed for VoyageCard display.
//   Full voyage data (companions, emergency contacts, etc.) is fetched lazily by
//   useVoyage(voyageId) only when the user opens a specific voyage.
//
// GRID LAYOUT:
//   Columns are determined from the window width context (useW) rather than CSS
//   grid auto-fill, so the number of columns responds to the same breakpoints
//   used throughout the app. This keeps column counts in sync with Sidebar width
//   changes that affect available content width.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAVY2, MUTED, WHITE, BORDER, FONT_DISPLAY, FONT_BODY, sty, BP } from '@/constants'
import { useW } from '@/context'
import { useVoyages, useVoyagePostCounts } from '@/features/voyages/hooks'
import VoyageCard from '@/features/voyages/VoyageCard'
import VoyageInvitesBanner from '@/features/voyages/VoyageInvitesBanner'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { STAGGER, FADE_UP } from '@/lib/motion'
import FE from '@/components/FE'
import { Plus } from 'lucide-react'

export default function VoyagesPage({ onSwitch }: { onSwitch?: (id: string) => void }) {
  const navigate  = useNavigate()
  const w         = useW()
  const { data: voyages = [], isLoading, error } = useVoyages()
  // Extract ids from the loaded voyages to pass to the post counts query.
  // When voyages is still loading, ids is [] and useVoyagePostCounts is disabled.
  const ids       = voyages.map(v => v.id)
  const { data: postCounts = {} } = useVoyagePostCounts(ids)

  // Breakpoint-responsive column count — matches the sidebar layout breakpoints.
  const cols = w < BP.mobile ? 1 : w < BP.tablet ? 2 : 3

  if (error) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: MUTED, fontFamily: FONT_BODY }}>
        <FE emoji="⚠️" size={36} />
        <p style={{ marginTop: 12 }}>Could not load your voyages. Please try again.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Pending co-author invites — renders nothing when there are none */}
      <VoyageInvitesBanner />

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            My Voyages
          </h2>
          {/* Only show count after load to avoid '0 voyages' flash while loading */}
          {!isLoading && voyages.length > 0 && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
              {voyages.length} voyage{voyages.length !== 1 ? 's' : ''} logged
            </p>
          )}
        </div>
        <motion.button
          onClick={() => navigate('/voyages/new')}
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          style={{ ...sty.btn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '10px 20px' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Voyage
        </motion.button>
      </div>

      {/* Loading skeletons — shown while useVoyages is fetching */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: 'minmax(280px, auto)', gap: 16 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state — guides new users to create their first voyage */}
      {!isLoading && voyages.length === 0 && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
          <EmptyState
            icon="🚢"
            heading="No voyages yet"
            body="Create your first voyage to start journalling your cruise — day by day, port by port."
            action={{ label: 'Create First Voyage', onClick: () => navigate('/voyages/new') }}
          />
        </div>
      )}

      {/* Voyage grid — staggered entrance animation via STAGGER / FADE_UP variants */}
      {!isLoading && voyages.length > 0 && (
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: w < BP.mobile ? 16 : 24, alignItems: 'start' }}
        >
          {voyages.map(voyage => (
            <motion.div key={voyage.id} variants={FADE_UP}>
              <VoyageCard
                voyage={voyage}
                // postCounts may still be loading — default 0 shows the badge
                // as empty rather than flashing a spinner inside the card.
                postCount={postCounts[voyage.id] ?? 0}
                onClick={() => onSwitch ? onSwitch(voyage.id) : navigate(`/voyages/${voyage.id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
