// ─────────────────────────────────────────────────────────────────────────────
// features/feed/FeedItem.tsx — Single item in the spec Feed (spec §4 FeedPage)
//
// Shows: author chip, relative timestamp, voyage breadcrumb, post preview,
// AudiencePill on own posts.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, TEAL, TEXT, FONT_DISPLAY, FONT_BODY } from '@/constants'
import AudiencePill from '@/features/posts/AudiencePill'
import FE from '@/components/FE'
import type { FeedRow } from './hooks'
import { useUserId } from '@/context'

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

function Avatar({ url, name, size = 38 }: { url: string | null; name: string | null; size?: number }) {
  const initials = (name ?? '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--t-primary-dk)', border: `2px solid ${BORDER}`,
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
  const navigate = useNavigate()
  const userId   = useUserId()
  const isOwnPost = item.user_id === userId

  const truncated   = item.body.length > BODY_PREVIEW
  const bodyPreview = truncated ? item.body.slice(0, BODY_PREVIEW).trimEnd() + '…' : item.body

  const voyageLabel = item.ship_name ?? item.cruise_line ?? 'Voyage'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        background:   WHITE,
        border:       `1px solid ${BORDER}`,
        borderRadius: 20,
        overflow:     'hidden',
        boxShadow:    '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Accent strip */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--t-primary-dk), var(--t-primary), var(--t-accent))' }} />

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar url={item.author_avatar_url} name={item.author_display_name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY, lineHeight: 1.2 }}>
              {item.author_display_name ?? 'Cruiser'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 8px', marginTop: 2 }}>
              {/* Voyage breadcrumb */}
              <button
                onClick={() => navigate(`/voyages/${item.voyage_id}`)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: TEAL, fontWeight: 600, fontFamily: FONT_BODY }}
              >
                🚢 {voyageLabel}
              </button>
              <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
                {relativeTime(item.created_at)}
              </span>
            </div>
          </div>
          {isOwnPost && (
            <AudiencePill audience={item.audience} />
          )}
        </div>

        {/* Post date + location */}
        {(item.post_date || item.location) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
            {item.post_date && (
              <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
                <FE emoji="📅" size={12} /> {formatPostDate(item.post_date)}
              </span>
            )}
            {item.location && (
              <span style={{ fontSize: 12, color: TEAL, fontWeight: 600, fontFamily: FONT_BODY }}>
                <FE emoji="📍" size={12} /> {item.location}
              </span>
            )}
          </div>
        )}

        {/* Post title */}
        {item.title && (
          <h3
            onClick={() => navigate(`/voyages/${item.voyage_id}/posts/${item.id}`)}
            style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, cursor: 'pointer', lineHeight: 1.3 }}
          >
            {item.title}
          </h3>
        )}

        {/* Post body preview */}
        <p
          onClick={() => navigate(`/voyages/${item.voyage_id}/posts/${item.id}`)}
          style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.75, cursor: 'pointer' }}
        >
          {bodyPreview}
          {truncated && (
            <span style={{ color: 'var(--t-primary)', fontWeight: 600 }}> Read more</span>
          )}
        </p>

        {/* Rating from metadata */}
        {typeof item.metadata?.rating === 'number' && item.metadata.rating > 0 && (
          <div style={{ marginTop: 10, fontSize: 14, color: '#F59E0B' }}>
            {'★'.repeat(item.metadata.rating as number)}{'☆'.repeat(5 - (item.metadata.rating as number))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
