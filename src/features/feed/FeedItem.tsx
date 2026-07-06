// ─────────────────────────────────────────────────────────────────────────────
// features/feed/FeedItem.tsx — Single item in the spec Feed (spec §4 FeedPage)
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, TEXT, FONT_DISPLAY, FONT_BODY } from '@/constants'
import AudiencePill from '@/features/posts/AudiencePill'
import type { FeedRow } from './hooks'
import { useUserId } from '@/context'
import { publicUrl } from '@/features/posts/mediaStorage'
import UserSafetyMenu from '@/features/safety/UserSafetyMenu'
import RichText from '@/features/social/richText'
import { useMentionPeople } from '@/features/social/useMentionPeople'
import PostEngagement from '@/features/posts/PostEngagement'

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
  const mentionPeople = useMentionPeople()
  const isOwnPost = item.user_id === userId

  const truncated   = item.body.length > BODY_PREVIEW
  const bodyPreview = truncated ? item.body.slice(0, BODY_PREVIEW).trimEnd() + '…' : item.body

  const voyageLabel = item.ship_name ?? item.cruise_line ?? 'Voyage'

  const mediaPaths = item.media_paths ?? []
  const heroPath   = mediaPaths[0] ?? null

  const rating = typeof item.metadata?.rating === 'number' ? (item.metadata.rating as number) : 0

  const goToPost = () => navigate(`/voyages/${item.voyage_id}/posts/${item.id}`)

  // Small translucent chip used on the photo/text overlays.
  const overlayChip: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    color: '#fff', fontSize: 11.5, fontWeight: 700, fontFamily: FONT_BODY,
    borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
  }
  const openVoyage = (e: { stopPropagation(): void }) => { e.stopPropagation(); navigate(`/voyages/${item.voyage_id}`) }

  // Chip for the light (no-photo) card.
  const lightChip: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#F3F4F6', color: MUTED, fontSize: 11.5, fontWeight: 700, fontFamily: FONT_BODY,
    borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
  }

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
      {heroPath ? (
        /* ── Photo post — bold image with text overlaid (Instagram-style) ── */
        <div onClick={goToPost} style={{ position: 'relative', cursor: 'pointer' }}>
          <motion.img
            src={publicUrl(heroPath)}
            alt={item.title ?? voyageLabel}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.45 }}
            style={{ width: '100%', aspectRatio: '4 / 5', maxHeight: 560, objectFit: 'cover', display: 'block' }}
          />

          {/* Top scrim — author + safety */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 12px 30px', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)' }}>
            <Avatar url={item.author_avatar_url} name={item.author_display_name} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY, textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>
                {item.author_display_name ?? 'Cruiser'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', fontFamily: FONT_BODY, textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>{relativeTime(item.created_at)}</span>
                {isOwnPost && <AudiencePill audience={item.audience} />}
              </div>
            </div>
            {!isOwnPost && (
              <div onClick={e => e.stopPropagation()} style={{ color: WHITE }}>
                <UserSafetyMenu targetUserId={item.user_id} postId={item.id} reportType="post" />
              </div>
            )}
          </div>

          {mediaPaths.length > 1 && (
            <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#fff', fontFamily: FONT_BODY, fontWeight: 600, pointerEvents: 'none' }}>
              1 / {mediaPaths.length}
            </div>
          )}

          {/* Bottom scrim — caption overlaid */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '52px 16px 16px', background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 9 }}>
              <button onClick={openVoyage} style={{ ...overlayChip, border: 'none', cursor: 'pointer' }}>🚢 {voyageLabel}</button>
              {item.location && <span style={overlayChip}>📍 {item.location}</span>}
              {rating > 0 && <span style={{ ...overlayChip, color: '#FFD84D' }}>★ {rating}.0</span>}
            </div>
            {item.title && (
              <h3 style={{ margin: '0 0 5px', fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 21, color: WHITE, lineHeight: 1.25, textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>{item.title}</h3>
            )}
            <p style={{ margin: 0, fontSize: 14.5, color: 'rgba(255,255,255,0.95)', lineHeight: 1.55, fontFamily: FONT_BODY, textShadow: '0 1px 5px rgba(0,0,0,0.6)' }}>
              <RichText text={bodyPreview} people={mentionPeople} />
              {truncated && <span style={{ fontWeight: 700 }}> more</span>}
            </p>
          </div>
        </div>
      ) : (
        /* ── Text-only post — plain white card with a hint of theme (accent strip) ── */
        <div onClick={goToPost} style={{ cursor: 'pointer', background: WHITE }}>
          {/* Accent strip — the hint of theme colour */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--t-primary-dk) 0%, var(--t-primary) 55%, var(--t-accent) 100%)' }} />
          <div style={{ padding: '16px 18px 18px', minHeight: 176, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar url={item.author_avatar_url} name={item.author_display_name} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{item.author_display_name ?? 'Cruiser'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                  <span style={{ fontSize: 11.5, color: MUTED, fontFamily: FONT_BODY }}>{relativeTime(item.created_at)}</span>
                  {isOwnPost && <AudiencePill audience={item.audience} />}
                </div>
              </div>
              {!isOwnPost && (
                <div onClick={e => e.stopPropagation()}>
                  <UserSafetyMenu targetUserId={item.user_id} postId={item.id} reportType="post" />
                </div>
              )}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 18 }}>
              {item.title && <h3 style={{ margin: '0 0 6px', fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 21, color: NAVY2, lineHeight: 1.25 }}>{item.title}</h3>}
              <p style={{ margin: 0, fontSize: 15, color: TEXT, lineHeight: 1.65, fontFamily: FONT_BODY }}>
                <RichText text={bodyPreview} people={mentionPeople} />
                {truncated && <span style={{ color: 'var(--t-primary)', fontWeight: 700 }}> more</span>}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                <button onClick={openVoyage} style={{ ...lightChip, background: 'var(--t-primary-dk)', color: '#fff', border: 'none', cursor: 'pointer' }}>🚢 {voyageLabel}</button>
                {item.location && <span style={lightChip}>📍 {item.location}</span>}
                {rating > 0 && <span style={{ ...lightChip, background: '#FEF3C7', color: '#92400E' }}>★ {rating}.0</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactions + comments */}
      <PostEngagement postId={item.id} voyageId={item.voyage_id} compact />
    </motion.div>
  )
}
