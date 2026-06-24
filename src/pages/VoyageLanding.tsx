// ─────────────────────────────────────────────────────────────────────────────
// pages/VoyageLanding.tsx — Voyage sub-landing (/voyages/:id)
//
// Opens when you tap a cruise on My Voyages. Two big social-app-style entries —
// Open Journal (the private tabbed journal) and Open Feed (this voyage's shared
// posts) — over a hero, then the scroll-driven "story so far" (VoyageStoryPage).
// ─────────────────────────────────────────────────────────────────────────────

import { lazy, Suspense } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, MessageCircle } from 'lucide-react'
import { NAVY2, WHITE, GOLD, FONT_BODY, BP } from '../constants'
import { useW } from '../context'
import { SkeletonCard } from '../components/ui/skeleton'
import type { VoyageData } from '../types'

const VoyageStoryPage = lazy(() => import('./VoyageStoryPage'))

interface Props {
  data:   VoyageData
  onNav:  (section: string) => void
}

export default function VoyageLanding({ data, onNav }: Props) {
  const navigate = useNavigate()
  const { voyageId } = useParams<{ voyageId: string }>()
  const w      = useW()
  const mobile = w < BP.mobile

  // The two big entries live on the story's cover (the title hero), passed in as
  // heroActions — so there's one title area, not a separate block above it.
  const heroActions = (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 12 : 16 }}>
      <BigButton
        icon={<BookOpen size={22} strokeWidth={2} />}
        label="Open Journal"
        sub="Your day-by-day journal"
        onClick={() => navigate(`/voyages/${voyageId}/journal`)}
        primary
      />
      <BigButton
        icon={<MessageCircle size={22} strokeWidth={2} />}
        label="Open Feed"
        sub="Shared moments & comments"
        onClick={() => navigate(`/voyages/${voyageId}/feed`)}
      />
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      {/* Back to hub — floats over the cover so the banner sits flush under the
          top bar (no cream gap). Pill styling keeps it legible on any cover photo. */}
      <button
        onClick={() => navigate('/voyages')}
        style={{ position: 'absolute', top: 14, left: 14, zIndex: 10, background: 'rgba(0,0,0,0.32)', border: 'none', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: WHITE, fontFamily: FONT_BODY, padding: '7px 14px', backdropFilter: 'blur(6px)' }}
      >
        <ArrowLeft size={15} /> My Voyages
      </button>

      <Suspense fallback={<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><SkeletonCard /><SkeletonCard /></div>}>
        <VoyageStoryPage
          voyage={data.voyage} itinerary={data.itinerary} dailyLogs={data.dailyLogs}
          budget={data.budget} foodLogs={data.foodLogs} diningLog={data.diningLog}
          onNav={onNav}
          onViewDay={() => navigate(`/voyages/${voyageId}/journal?tab=daily`)}
          heroActions={heroActions}
        />
      </Suspense>
    </div>
  )
}

function BigButton({ icon, label, sub, onClick, primary }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void; primary?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
        border: primary ? 'none' : '1.5px solid rgba(255,255,255,0.6)',
        background: primary ? GOLD : 'rgba(255,255,255,0.12)',
        color: primary ? NAVY2 : WHITE,
        borderRadius: 16, padding: '16px 20px', fontFamily: FONT_BODY,
        backdropFilter: primary ? undefined : 'blur(6px)',
        boxShadow: primary ? '0 6px 20px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 700, lineHeight: 1.1 }}>{label}</span>
        <span style={{ display: 'block', fontSize: 12.5, opacity: 0.8, marginTop: 3 }}>{sub}</span>
      </span>
    </motion.button>
  )
}
