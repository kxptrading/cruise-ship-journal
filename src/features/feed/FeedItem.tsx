// ─────────────────────────────────────────────────────────────────────────────
// features/feed/FeedItem.tsx — Single item in the spec Feed (spec §4 FeedPage)
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, TEAL, TEXT, FONT_DISPLAY, FONT_BODY } from '@/constants'
import AudiencePill from '@/features/posts/AudiencePill'
import FE from '@/components/FE'
import type { FeedRow } from './hooks'
import MediaThumbnails from '@/ui/MediaThumbnails'
import { useUserId } from '@/context'
import { publicUrl } from '@/features/posts/mediaStorage'
import UserSafetyMenu from '@/features/safety/UserSafetyMenu'

const BODY_PREVIEW = 240

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPostDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 42 }: { url: string | null; name: string | null; size?: number }) {
  const initials = (name ?? '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--t-primary-dk)', border: `2.5px solid ${BORDER}`,
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    }}>
      {url
        ? <img src={url} alt={name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.34, fontWeight: 700, color: '#fff', fontFamily: FONT_BODY }}>{initials}</span>
      }
    </div>
  )
}

// ── FeedItem ──────────────────────────────────────────────────────────────────

interface Props {
  item: FeedRow
}

export default function FeedItem({ item }: Props) {
  const navigate  = useNavigate()
  const userId    = useUserId()
  const isOwnPost = item.user_id === userId

  const truncated   = item.body.length > BODY_PREVIEW
  const bodyPreview = truncated ? item.body.slice(0, BODY_PREVIEW).trimEnd() + '…' : item.body

  const voyageLabel = item.ship_name ?? item.cruise_line ?? 'Voyage'

  const mediaPaths = item.media_paths ?? []
  const heroPath   = mediaPaths[0] ?? null
  const restPaths  = mediaPaths.slice(1)

  const rating = typeof item.metadata?.rating === 'number' ? (item.metadata.rating as number) : 0

  const goToPost = () => navigate(`/voyages/${item.voyage_id}/posts/${item.id}`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 16px 48px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.05)' }}
      transition={{ duration: 0.22 }}
      style={{
        background:   WHITE,
        border:       `1px solid ${BORDER}`,
        borderRadius: 20,
        overflow:     'hidden',
        boxShadow:    '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Accent strip */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, var(--t-primary-dk) 0%, var(--t-primary) 55%, var(--t-accent) 100%)' }} />

      {/* Author row */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Avatar url={item.author_avatar_url} name={item.author_display_name} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>
              {item.author_display_name ?? 'Cruiser'}
            </span>
            {/* Voyage badge */}
            <button
              onClick={() => navigate(`/voyages/${item.voyage_id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--t-primary-dk)', color: '#fff',
                border: 'none', borderRadius: 20, padding: '2px 9px',
                cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: FONT_BODY,
                flexShrink: 0, letterSpacing: '0.01em',
              }}
            >
              🚢 {voyageLabel}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>{relativeTime(item.created_at)}</span>
            {isOwnPost && <AudiencePill audience={item.audience} />}
          </div>
        </div>

        {/* Safety menu — only for other users' posts */}
        {!isOwnPost && (
          <UserSafetyMenu targetUserId={item.user_id} postId={item.id} reportType="post" />
        )}

        {/* Rating badge — top-right */}
        {rating > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
            background: '#FEF3C7', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 20, padding: '4px 10px',
          }}>
            <span style={{ color: '#F59E0B', fontSize: 13 }}>★</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E', fontFamily: FONT_BODY }}>{rating}.0</span>
          </div>
        )}
      </div>

      {/* Date + location pills */}
      {(item.post_date || item.location) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 16px 12px' }}>
          {item.post_date && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: MUTED, fontFamily: FONT_BODY,
              background: '#F3F4F6', borderRadius: 20, padding: '3px 10px',
            }}>
              <FE emoji="📅" size={12} /> {formatPostDate(item.post_date)}
            </span>
          )}
          {item.location && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: TEAL, fontWeight: 700, fontFamily: FONT_BODY,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 20, padding: '3px 10px',
            }}>
              <FE emoji="📍" size={12} /> {item.location}
            </span>
          )}
        </div>
      )}

      {/* Hero image — first photo full-width, click navigates to post */}
      {heroPath && (
        <div
          onClick={goToPost}
          style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
        >
          <motion.img
            src={publicUrl(heroPath)}
            alt={item.title ?? voyageLabel}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.35 }}
            style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
          />
          {/* Photo count badge when multiple images */}
          {mediaPaths.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 10, right: 12,
              background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)',
              borderRadius: 20, padding: '3px 10px',
              fontSize: 11, color: '#fff', fontFamily: FONT_BODY, fontWeight: 600,
            }}>
              1 / {mediaPaths.length}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Post title */}
        {item.title && (
          <h3
            onClick={goToPost}
            style={{
              margin: '0 0 8px', fontSize: 18, fontWeight: 400,
              color: NAVY2, fontFamily: FONT_DISPLAY, cursor: 'pointer', lineHeight: 1.3,
            }}
          >
            {item.title}
          </h3>
        )}

        {/* Post body preview */}
        <p
          onClick={goToPost}
          style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.75, cursor: 'pointer' }}
        >
          {bodyPreview}
          {truncated && (
            <span style={{ color: 'var(--t-primary)', fontWeight: 600 }}> Read more</span>
          )}
        </p>

        {/* Additional photos as thumbnails */}
        {restPaths.length > 0 && (
          <MediaThumbnails paths={restPaths} maxShow={3} size="sm" />
        )}
      </div>

      {/* Footer: read full post */}
      <div
        onClick={goToPost}
        style={{
          borderTop: `1px solid ${BORDER}`,
          padding: '10px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#FAFAFA',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA' }}
      >
        <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
          {item.location ? `📍 ${item.location}` : voyageLabel}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-primary)', fontFamily: FONT_BODY }}>
          Read full post →
        </span>
      </div>
    </motion.div>
  )
}
