// ─────────────────────────────────────────────────────────────────────────────
// pages/VoyageFeedPage.tsx — This voyage's social feed (/voyages/:id/feed)
//
// The "Open Feed" entry from the voyage landing: the shared posts for this cruise,
// rendered feed-style. Thin wrapper around PostList (which self-fetches by voyageId
// and renders the feed cards).
// ─────────────────────────────────────────────────────────────────────────────

import { lazy, Suspense } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus } from 'lucide-react'
import { NAVY2, GOLD, TEXT, MUTED, BORDER, FONT_DISPLAY, FONT_BODY, sty } from '../constants'
import { SkeletonCard } from '../components/ui/skeleton'

const PostList = lazy(() => import('../features/posts/PostList'))

export default function VoyageFeedPage() {
  const navigate = useNavigate()
  const { voyageId } = useParams<{ voyageId: string }>()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(voyageId ? `/voyages/${voyageId}` : '/voyages')}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
          >
            <ArrowLeft size={15} /> Voyage
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>Feed</h1>
        </div>
        <motion.button
          onClick={() => navigate(`/voyages/${voyageId}/posts/new`)}
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          style={{ ...sty.btn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '9px 18px', background: GOLD + 'EE', color: TEXT, boxShadow: 'none' }}
        >
          <Plus size={15} strokeWidth={2.5} /> New Post
        </motion.button>
      </div>

      {voyageId && (
        <Suspense fallback={<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><SkeletonCard /><SkeletonCard /></div>}>
          <PostList voyageId={voyageId} />
        </Suspense>
      )}
    </div>
  )
}
