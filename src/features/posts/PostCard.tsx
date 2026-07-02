// ─────────────────────────────────────────────────────────────────────────────
// sections/feed/PostCard.tsx — Single daily-log post card
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, CORAL, FONT_DISPLAY, FONT_BODY, WX_EMOJI, WX_STYLE } from '../../constants'
import { useW } from '../../context'
import type { FeedItem, FeedAuthor, ReactionState, Comment } from '../../types'
import FE from '../../components/FE'
import { Card } from '../../components/ui/card'
import { STAGGER, FADE_UP, SCALE_POP, SCALE_POP_TRANSITION, REACTION_FLOAT } from '../../lib/motion'
import RichText from '../social/richText'
import MentionInput from '../social/MentionInput'
import { useMentionPeople } from '../social/useMentionPeople'

const TRUNCATE_LIMIT = 220

// ── Reaction definitions ──────────────────────────────────────────────────────
interface Reaction { id: string; emoji: string; label: string }

export const REACTIONS: Reaction[] = [
  { id: 'love',      emoji: '🚢', label: 'Love This' },
  { id: 'epic',      emoji: '🌊', label: 'Epic Memory' },
  { id: 'wish',      emoji: '🍹', label: 'Wish I Was There' },
  { id: 'hilarious', emoji: '😂', label: 'Hilarious' },
  { id: 'shot',      emoji: '📸', label: 'Great Shot' },
]

// ── Lightbox ──────────────────────────────────────────────────────────────────
function PhotoLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent | globalThis.KeyboardEvent) => { if ((e as globalThis.KeyboardEvent).key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, cursor: 'zoom-out',
      }}
    >
      <motion.img
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        src={src} alt={alt}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', cursor: 'default', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
      />
      <button
        onClick={onClose}
        style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: WHITE, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      >✕</button>
    </motion.div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  item:           FeedItem
  onViewDay?:     (dayIndex: number) => void
  avatarUrl?:     string | null
  initials?:      string
  displayName?:   string
  author?:        FeedAuthor | null
  onViewProfile?: () => void
  reactions?:     Record<string, ReactionState> | null
  onReact?:       (id: string) => void
  comments?:      Comment[]
  onAddComment?:  (text: string) => Promise<void>
  onEditComment?: (commentId: string, text: string) => Promise<void>
  userId?:        string
}

export default function PostCard({ item, onViewDay, avatarUrl, initials, displayName, author, onViewProfile, reactions, onReact, comments, onAddComment, onEditComment, userId }: Props) {
  const w = useW()
  const mentionPeople = useMentionPeople()
  const [showComments,   setShowComments]   = useState<boolean>(false)
  const [commentText,    setCommentText]    = useState<string>('')
  const [submitting,     setSubmitting]     = useState<boolean>(false)
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editText,       setEditText]       = useState<string>('')
  const [saving,         setSaving]         = useState<boolean>(false)
  const [pickerOpen,     setPickerOpen]     = useState<boolean>(false)
  const [flashEmoji,     setFlashEmoji]     = useState<string | null>(null)
  const [lightboxOpen,   setLightboxOpen]   = useState<boolean>(false)
  const [textExpanded,   setTextExpanded]   = useState<boolean>(false)
  const commentInputRef  = useRef<HTMLTextAreaElement>(null)
  const longPressTimer   = useRef<number | null>(null)
  const pickerRef        = useRef<HTMLDivElement>(null)

  // ── Reaction helpers ─────────────────────────────────────────────────────────
  const myReaction = REACTIONS.find(r => reactions?.[r.id]?.mine)
  const reactionSummary = REACTIONS
    .filter(r => (reactions?.[r.id]?.count || 0) > 0)
    .sort((a, b) => (reactions?.[b.id]?.count || 0) - (reactions?.[a.id]?.count || 0))
  const totalReactions = reactionSummary.reduce((s, r) => s + (reactions?.[r.id]?.count || 0), 0)

  const openPicker  = () => setPickerOpen(true)
  const closePicker = () => setPickerOpen(false)

  const handlePressStart = () => { longPressTimer.current = window.setTimeout(openPicker, 400) }
  const handlePressEnd   = () => { if (longPressTimer.current !== null) { clearTimeout(longPressTimer.current); longPressTimer.current = null } }

  const handleReactTap = () => {
    if (pickerOpen) { closePicker(); return }
    if (myReaction) { onReact?.(myReaction.id) } else { openPicker() }
  }

  const handlePickReaction = (id: string) => {
    closePicker()
    onReact?.(id)
    const emoji = REACTIONS.find(r => r.id === id)?.emoji
    if (emoji) { setFlashEmoji(emoji); window.setTimeout(() => setFlashEmoji(null), 800) }
  }

  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) closePicker()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [pickerOpen])

  // ── Comment submit ────────────────────────────────────────────────────────────
  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    await onAddComment?.(commentText.trim())
    setCommentText('')
    setSubmitting(false)
    commentInputRef.current?.focus()
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim() || saving) return
    setSaving(true)
    await onEditComment?.(commentId, editText.trim())
    setEditingId(null)
    setEditText('')
    setSaving(false)
  }

  const { dayIndex, resolvedPort, date, highlights, bestMoment, weather,
          breakfast, lunch, dinner, drink, activity, rating, photo } = item

  const displayAvatar   = author ? author.avatarUrl : avatarUrl
  const displayInitials = author ? author.initials  : initials
  const commentCount    = comments?.length || 0

  const meals = [
    breakfast && { icon: '🍳', text: breakfast },
    lunch     && { icon: '🥗', text: lunch },
    dinner    && { icon: '🍝', text: dinner },
    drink     && { icon: '🍷', text: drink },
  ].filter(Boolean) as { icon: string; text: string }[]

  const shouldTruncate = highlights.length > TRUNCATE_LIMIT
  const displayText    = shouldTruncate && !textExpanded
    ? highlights.slice(0, TRUNCATE_LIMIT).trimEnd() + '…'
    : highlights

  return (
    <>
      <Card
        variant="elevated"
        style={{ borderRadius: 24, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)' }}
      >
        {/* Gradient accent strip */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--t-primary-dk) 0%, var(--t-primary) 60%, var(--t-accent) 100%)', zIndex: 1, pointerEvents: 'none' }} />

        {/* ── Header: author + day/port/date ─────────────────────────────────── */}
        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: NAVY2, border: `2px solid ${BORDER}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {displayAvatar
                ? <img src={displayAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span style={{ fontSize: 14, fontWeight: 700, color: WHITE, fontFamily: FONT_DISPLAY }}>{displayInitials}</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                onClick={onViewProfile}
                style={{ fontSize: 14, fontWeight: 700, color: NAVY2, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: onViewProfile ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (onViewProfile) e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
              >
                {author ? author.name : displayName}
              </div>
              {author?.shipName && (
                <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{author.shipName}</div>
              )}
            </div>
            {author && (
              <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, background: GOLD + '18', border: `1px solid ${GOLD}40`, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>Friend</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
            <div style={{ background: NAVY, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: WHITE, fontFamily: FONT_DISPLAY }}>{dayIndex + 1}</span>
            </div>
            {resolvedPort && <div style={{ fontSize: 12, fontWeight: 600, color: NAVY2, textAlign: 'right' }}>{resolvedPort}</div>}
            {date && (
              <div style={{ fontSize: 11, color: MUTED, textAlign: 'right' }}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {/* ── Hero photo — tap to lightbox ────────────────────────────────────── */}
        {photo && (
          <div style={{ width: '100%', overflow: 'hidden', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, cursor: 'zoom-in', position: 'relative' }}>
            <motion.img
              src={photo.dataUrl}
              alt={photo.caption || resolvedPort || `Day ${dayIndex + 1}`}
              onClick={() => setLightboxOpen(true)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' }}
            />
            {/* Zoom hint overlay */}
            <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: '3px 8px', fontSize: 10, color: WHITE, fontFamily: FONT_BODY, pointerEvents: 'none' }}>
              Tap to expand
            </div>
            {photo.caption && (
              <div style={{ padding: '7px 16px', background: '#FAFAF8', borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
                {photo.caption}
              </div>
            )}
          </div>
        )}

        {/* ── Post body ────────────────────────────────────────────────────────── */}
        <div style={{ padding: '16px 18px' }}>
          {(highlights || rating > 0) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              {highlights && (
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.7 }}><RichText text={displayText} people={mentionPeople} /></p>
                  {shouldTruncate && (
                    <button
                      onClick={() => setTextExpanded(v => !v)}
                      style={{ background: 'none', border: 'none', padding: '4px 0 0', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--t-primary)', fontFamily: FONT_BODY }}
                    >
                      {textExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
              {rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: GOLD + '18', borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
                  <span style={{ color: GOLD, fontSize: 13 }}>★</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{rating}.0</span>
                </div>
              )}
            </div>
          )}

          {bestMoment && (
            <div style={{ borderLeft: `3px solid ${CORAL}`, marginBottom: 14, background: 'rgba(249,115,22,0.06)', borderRadius: '0 10px 10px 0', padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: CORAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: FONT_BODY }}>Best Moment</div>
              <div style={{ fontSize: 16, color: '#92400E', fontStyle: 'italic', lineHeight: 1.6, fontFamily: FONT_DISPLAY, fontWeight: 400 }}>{bestMoment}</div>
            </div>
          )}

          {activity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <FE emoji="🚤" size={14} />
              <span style={{ fontSize: 13, color: TEXT }}><strong>Excursion:</strong> {activity}</span>
            </div>
          )}

          {(weather || []).length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {weather.map(wx => (
                <span key={wx} style={{ fontSize: 12, borderRadius: 20, padding: '3px 10px', ...(WX_STYLE[wx] || { background: '#F0F7FF', border: '1px solid #C7DCF5', color: '#2563EB' }) }}>
                  <FE emoji={WX_EMOJI[wx] || '🌈'} size={14} /> {wx}
                </span>
              ))}
            </div>
          )}

          {meals.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>What I ate</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {meals.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <FE emoji={m.icon} size={14} />
                    <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Reaction bar ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* React button + spring-animated picker */}
          <div ref={pickerRef} style={{ position: 'relative', flexShrink: 0 }}>
            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.92 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 340 }}
                  style={{
                    position: 'absolute', bottom: 'calc(100% + 10px)', left: 0,
                    display: 'flex', gap: 4, alignItems: 'center',
                    background: WHITE, borderRadius: 40, padding: '8px 12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
                    border: `1px solid ${BORDER}`, zIndex: 50,
                  }}
                >
                  {REACTIONS.map((r, i) => (
                    <motion.button
                      key={r.id}
                      initial={{ y: 20, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 380, delay: i * 0.04 }}
                      onClick={() => handlePickReaction(r.id)}
                      title={r.label}
                      whileHover={{ scale: 1.4, y: -4 }}
                      whileTap={{ scale: 0.85 }}
                      style={{
                        background: reactions?.[r.id]?.mine ? `${GOLD}22` : 'none',
                        border: reactions?.[r.id]?.mine ? `1px solid ${GOLD}60` : '1px solid transparent',
                        cursor: 'pointer', padding: 5, borderRadius: '50%', lineHeight: 1,
                      }}
                    >
                      <FE emoji={r.emoji} size={26} />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Float animation on react */}
            <AnimatePresence>
              {flashEmoji && (
                <motion.div
                  key={flashEmoji + Date.now()}
                  variants={REACTION_FLOAT}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0 }}
                  style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, pointerEvents: 'none', zIndex: 60 }}
                >
                  <FE emoji={flashEmoji} size={28} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleReactTap}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={e => { handlePressEnd(); if (!pickerOpen) e.currentTarget.style.borderColor = myReaction ? 'var(--t-primary)' : BORDER }}
              onMouseEnter={() => { if (!pickerOpen && !myReaction) setPickerOpen(true) }}
              animate={myReaction ? SCALE_POP : undefined}
              transition={myReaction ? SCALE_POP_TRANSITION : undefined}
              whileTap={{ scale: 0.93 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: myReaction ? 'var(--t-bg)' : 'transparent',
                border: `1.5px solid ${myReaction ? 'var(--t-primary)' : BORDER}`,
                borderRadius: 20, padding: '7px 16px', cursor: 'pointer',
                fontFamily: FONT_BODY, color: myReaction ? 'var(--t-primary)' : MUTED,
                fontSize: 13, fontWeight: 700, userSelect: 'none', WebkitUserSelect: 'none',
              }}
            >
              <FE emoji={myReaction ? myReaction.emoji : '👍'} size={18} />
              {myReaction ? myReaction.label : 'React'}
            </motion.button>
          </div>

          {/* Reaction summary */}
          {totalReactions > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{ display: 'flex' }}>
                {reactionSummary.slice(0, 3).map((r, i) => (
                  <span key={r.id} style={{ lineHeight: 1, marginLeft: i === 0 ? 0 : -4, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}>
                    <FE emoji={r.emoji} size={15} />
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{totalReactions}</span>
            </div>
          )}

          {/* Comments toggle */}
          <button
            onClick={() => {
              setShowComments(s => {
                if (!s) window.setTimeout(() => commentInputRef.current?.focus(), 80)
                return !s
              })
            }}
            style={{
              marginLeft: 'auto', background: 'none', flexShrink: 0,
              border: `1.5px solid ${showComments ? NAVY : BORDER}`,
              borderRadius: 20, padding: '7px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: showComments ? NAVY : MUTED, fontFamily: FONT_BODY,
              fontSize: 13, fontWeight: 700, transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            <FE emoji="💬" size={15} />
            {commentCount > 0
              ? (showComments ? 'Hide' : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`)
              : 'Comment'}
          </button>
        </div>

        {/* ── Comments thread — stagger-animated ─────────────────────────────── */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 16px 16px', background: '#FAFAFA' }}>
                {commentCount > 0 && (
                  <motion.div
                    variants={STAGGER}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}
                  >
                    {comments!.map(c => {
                      const isOwn     = c.user_id === userId
                      const isEditing = editingId === c.id
                      return (
                        <motion.div key={c.id} variants={FADE_UP} style={{ display: 'flex', gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: NAVY2, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {c.authorAvatar
                              ? <img src={c.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: 10, fontWeight: 700, color: WHITE }}>{c.authorInitials}</span>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                                <textarea
                                  value={editText}
                                  onChange={e => setEditText(e.target.value)}
                                  onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(c.id) }
                                    if (e.key === 'Escape') { setEditingId(null); setEditText('') }
                                  }}
                                  autoFocus rows={2}
                                  style={{ flex: 1, border: `1.5px solid ${NAVY}`, borderRadius: 12, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5, color: TEXT, boxSizing: 'border-box', minWidth: 0 }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <button onClick={() => handleSaveEdit(c.id)} disabled={!editText.trim() || saving}
                                    style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, opacity: !editText.trim() || saving ? 0.5 : 1 }}>
                                    {saving ? '…' : 'Save'}
                                  </button>
                                  <button onClick={() => { setEditingId(null); setEditText('') }}
                                    style={{ background: 'none', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: '4px 14px 14px 14px', padding: '8px 12px', maxWidth: '100%', wordBreak: 'break-word' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY2, marginBottom: 3 }}>{c.authorName}</div>
                                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.55 }}><RichText text={c.body} people={mentionPeople} /></div>
                              </div>
                            )}
                            <div style={{ fontSize: 10, color: MUTED, marginTop: 4, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>
                                {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                {' · '}{new Date(c.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && !isEditing && (
                                <button onClick={() => { setEditingId(c.id); setEditText(c.body) }}
                                  style={{ background: 'none', border: 'none', padding: 0, fontSize: 10, color: MUTED, cursor: 'pointer', fontFamily: FONT_BODY, fontWeight: 700, textDecoration: 'underline' }}>
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}

                {/* Comment input — slides up with the section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.08 }}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: NAVY2, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(author ? author.avatarUrl : avatarUrl)
                      ? <img src={author ? author.avatarUrl : avatarUrl!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 10, fontWeight: 700, color: WHITE }}>{author ? author.initials : initials}</span>
                    }
                  </div>
                  <MentionInput
                    ref={commentInputRef}
                    value={commentText}
                    onChange={setCommentText}
                    onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment() } }}
                    placeholder="Write a comment… @ to mention"
                    rows={1}
                    style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '7px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5, color: TEXT, background: WHITE, boxSizing: 'border-box', minWidth: 0, width: '100%' }}
                  />
                  <motion.button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submitting}
                    whileTap={{ scale: 0.88 }}
                    style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: commentText.trim() ? NAVY : BORDER, color: commentText.trim() ? WHITE : MUTED, border: 'none', cursor: commentText.trim() ? 'pointer' : 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}
                  >↑</motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer: view full day link (own posts only) ─────────────────────── */}
        {onViewDay && (
          <div style={{ padding: '10px 18px', borderTop: `1px solid ${BORDER}`, background: '#FAFAFA', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onViewDay(dayIndex)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: NAVY2, fontFamily: FONT_BODY, fontWeight: 700, padding: 0 }}
            >
              View full day →
            </button>
          </div>
        )}
      </Card>

      {/* Lightbox — rendered outside Card so it's not clipped by overflow:hidden */}
      <AnimatePresence>
        {lightboxOpen && photo && (
          <PhotoLightbox
            src={photo.dataUrl}
            alt={photo.caption || resolvedPort || `Day ${dayIndex + 1}`}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
