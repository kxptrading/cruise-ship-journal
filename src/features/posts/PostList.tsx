// ─────────────────────────────────────────────────────────────────────────────
// features/posts/PostList.tsx — Reverse-chron post list for VoyageDetailPage
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { WHITE, BORDER, MUTED, FONT_BODY, sty } from '@/constants'
import { usePostsByVoyage } from './hooks'
import JournalPostCard from './JournalPostCard'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { STAGGER, FADE_UP } from '@/lib/motion'
import { Plus } from 'lucide-react'

interface Props {
  voyageId: string
}

export default function PostList({ voyageId }: Props) {
  const navigate = useNavigate()
  const { data: posts = [], isLoading, error } = usePostsByVoyage(voyageId)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: MUTED, fontFamily: FONT_BODY, fontSize: 14 }}>
        Could not load posts. Please try again.
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
        <EmptyState
          icon="✍️"
          heading="No posts yet"
          body="Write your first post for this voyage — capture your highlights, thoughts, and best moments."
          action={{ label: 'Write First Post', onClick: () => navigate(`/voyages/${voyageId}/posts/new`) }}
        />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
          {posts.length} post{posts.length !== 1 ? 's' : ''}
        </span>
        <motion.button
          onClick={() => navigate(`/voyages/${voyageId}/posts/new`)}
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          style={{ ...sty.btn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 16px' }}
        >
          <Plus size={14} strokeWidth={2.5} /> New Post
        </motion.button>
      </div>

      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {posts.map(post => (
          <motion.div key={post.id} variants={FADE_UP}>
            <JournalPostCard post={post} voyageId={voyageId} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
