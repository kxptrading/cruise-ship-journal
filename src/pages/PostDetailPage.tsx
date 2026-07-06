// ─────────────────────────────────────────────────────────────────────────────
// pages/PostDetailPage.tsx — Full post view (/voyages/:id/posts/:postId)
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAVY2, MUTED, TEXT, GOLD, TEAL, WHITE, BORDER, FONT_DISPLAY, FONT_BODY } from '@/constants'
import RichText from '@/features/social/richText'
import { useMentionPeople } from '@/features/social/useMentionPeople'
import PostEngagement from '@/features/posts/PostEngagement'
import { usePost, useDeletePost } from '@/features/posts/hooks'
import AudiencePill from '@/features/posts/AudiencePill'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import FE from '@/components/FE'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import MediaThumbnails from '@/ui/MediaThumbnails'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PostDetailPage() {
  const navigate             = useNavigate()
  const { voyageId, postId } = useParams<{ voyageId: string; postId: string }>()
  const { data: post, isLoading } = usePost(postId)
  const mentionPeople        = useMentionPeople()
  const deletePost           = useDeletePost()
  const [confirmDel, setConfirmDel] = useState(false)

  const handleDelete = async () => {
    if (!postId || !voyageId) return
    await deletePost.mutateAsync({ postId, voyageId })
    navigate(`/voyages/${voyageId}`)
  }

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><SkeletonCard /></div>

  if (!post) return (
    <EmptyState icon="🔍" heading="Post not found" body="This post may have been deleted."
      action={{ label: 'Back to Voyage', onClick: () => navigate(`/voyages/${voyageId}`) }} />
  )

  const meta   = post.metadata ?? {}
  const rating = typeof meta.rating === 'number' ? meta.rating : null
  const weather: string[] = Array.isArray(meta.weather) ? (meta.weather as string[]) : []
  const meals  = (['breakfast','lunch','dinner','drink'] as const).map(k =>
    typeof meta[k] === 'string' && meta[k] ? { key: k, text: meta[k] as string } : null
  ).filter(Boolean) as { key: string; text: string }[]
  const MEAL_EMOJI: Record<string, string> = { breakfast: '🍳', lunch: '🥗', dinner: '🍝', drink: '🍷' }

  return (
    <div>
      {/* Back + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <button
          onClick={() => navigate(`/voyages/${voyageId}`)}
          style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
        >
          <ArrowLeft size={15} /> Back to Voyage
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/voyages/${voyageId}/posts/${postId}/edit`)}
            style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => setConfirmDel(true)}
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#DC2626', fontFamily: FONT_BODY }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Post card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
        style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--t-primary-dk), var(--t-primary), var(--t-accent))' }} />
        <div style={{ padding: '20px 22px 24px' }}>
          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {post.post_date && <span style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>{formatDate(post.post_date)}</span>}
            {post.location  && <span style={{ fontSize: 13, color: TEAL, fontWeight: 600, fontFamily: FONT_BODY }}><FE emoji="📍" size={13} /> {post.location}</span>}
            <AudiencePill audience={post.audience} size="md" />
          </div>

          {/* Title */}
          {post.title && (
            <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.2 }}>
              {post.title}
            </h1>
          )}

          {/* Body */}
          <p style={{ margin: '0 0 20px', fontSize: 15, color: TEXT, lineHeight: 1.8 }}>
            <RichText text={post.body} people={mentionPeople} />
          </p>

          {/* Photos */}
          {(post.media_paths ?? []).length > 0 && (
            <MediaThumbnails paths={post.media_paths} />
          )}

          {/* Rating */}
          {rating !== null && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 16, color: GOLD }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
            </div>
          )}

          {/* Weather chips */}
          {weather.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {weather.map(w => (
                <span key={w} style={{ fontSize: 13, background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 20, padding: '3px 12px', color: '#374151', fontFamily: FONT_BODY }}>
                  {({ Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️', Windy: '💨', Hot: '🌡️', Mild: '🌤️', Cool: '❄️' } as Record<string, string>)[w] ?? ''} {w}
                </span>
              ))}
            </div>
          )}

          {/* Meal log from metadata */}
          {meals.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, fontFamily: FONT_BODY }}>What I ate</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {meals.map(({ key, text }) => (
                  <div key={key} style={{ display: 'flex', gap: 10, fontSize: 14, color: TEXT, fontFamily: FONT_BODY }}>
                    <span>{MEAL_EMOJI[key]}</span>
                    <span style={{ flex: 1 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Reactions + comments */}
      {postId && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', marginTop: 16 }}>
          <PostEngagement postId={postId} voyageId={voyageId} />
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setConfirmDel(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: WHITE, borderRadius: 18, padding: '24px', maxWidth: 340, width: '100%' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>Delete post?</h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: MUTED, fontFamily: FONT_BODY, lineHeight: 1.6 }}>This cannot be undone. It will be removed from your journal and any feeds.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmDel(false)}
                  style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>Cancel</button>
                <button onClick={handleDelete} disabled={deletePost.isPending}
                  style={{ background: '#DC2626', color: WHITE, border: 'none', borderRadius: 10, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY }}>
                  {deletePost.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
