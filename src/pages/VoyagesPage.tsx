// ─────────────────────────────────────────────────────────────────────────────
// pages/VoyagesPage.tsx — My Voyages list (spec §4: /voyages)
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAVY2, MUTED, WHITE, BORDER, FONT_DISPLAY, FONT_BODY, sty, BP } from '@/constants'
import { useW } from '@/context'
import { useVoyages, useVoyagePostCounts } from '@/features/voyages/hooks'
import VoyageCard from '@/features/voyages/VoyageCard'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { STAGGER, FADE_UP } from '@/lib/motion'
import FE from '@/components/FE'
import { Plus } from 'lucide-react'

export default function VoyagesPage() {
  const navigate  = useNavigate()
  const w         = useW()
  const { data: voyages = [], isLoading, error } = useVoyages()
  const ids       = voyages.map(v => v.id)
  const { data: postCounts = {} } = useVoyagePostCounts(ids)

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
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: w < BP.mobile ? 24 : 30, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            My Voyages
          </h1>
          {!isLoading && voyages.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
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

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
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

      {/* Voyage grid */}
      {!isLoading && voyages.length > 0 && (
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}
        >
          {voyages.map(voyage => (
            <motion.div key={voyage.id} variants={FADE_UP}>
              <VoyageCard
                voyage={voyage}
                postCount={postCounts[voyage.id] ?? 0}
                onClick={() => navigate(`/voyages/${voyage.id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
