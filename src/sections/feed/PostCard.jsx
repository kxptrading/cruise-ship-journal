// ─────────────────────────────────────────────────────────────────────────────
// sections/feed/PostCard.jsx — Single daily-log post card
//
// Renders one feed entry: header (author + day badge), optional hero photo,
// post body (highlights, best moment, activity, weather, meals), the reaction
// bar (long-press picker + amalgamated summary), and the collapsible comment
// thread.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, CORAL, FONT_DISPLAY, FONT_BODY, WX_EMOJI, WX_STYLE } from '../../constants'
import { useW } from '../../context'

// ── Reaction definitions ──────────────────────────────────────────────────────
export const REACTIONS = [
  { id: 'love',      emoji: '🚢', label: 'Love This' },
  { id: 'epic',      emoji: '🌊', label: 'Epic Memory' },
  { id: 'wish',      emoji: '🍹', label: 'Wish I Was There' },
  { id: 'hilarious', emoji: '😂', label: 'Hilarious' },
  { id: 'shot',      emoji: '📸', label: 'Great Shot' },
]

export default function PostCard({ item, onViewDay, avatarUrl, initials, displayName, author, reactions, onReact, comments, onAddComment, onEditComment, userId }) {
  const w = useW()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText]   = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [editText, setEditText]         = useState('')
  const [saving, setSaving]             = useState(false)
  const [pickerOpen, setPickerOpen]     = useState(false)
  const commentInputRef = useRef(null)
  const longPressTimer  = useRef(null)
  const pickerRef       = useRef(null)

  // ── My active reaction (if any) ──────────────────────────────────────────────
  const myReaction = REACTIONS.find(r => reactions?.[r.id]?.mine)

  // ── Amalgamated reaction summary ──────────────────────────────────────────────
  const reactionSummary = REACTIONS
    .filter(r => (reactions?.[r.id]?.count || 0) > 0)
    .sort((a, b) => (reactions?.[b.id]?.count || 0) - (reactions?.[a.id]?.count || 0))
  const totalReactions = reactionSummary.reduce((s, r) => s + (reactions?.[r.id]?.count || 0), 0)

  // ── Long press (mobile) / hover (desktop) to open picker ─────────────────────
  const openPicker  = () => setPickerOpen(true)
  const closePicker = () => setPickerOpen(false)

  const handlePressStart = () => { longPressTimer.current = setTimeout(openPicker, 400) }
  const handlePressEnd   = () => { clearTimeout(longPressTimer.current) }

  const handleReactTap = () => {
    if (pickerOpen) { closePicker(); return }
    if (myReaction) { onReact?.(myReaction.id) } else { openPicker() }
  }

  const handlePickReaction = (id) => { closePicker(); onReact?.(id) }

  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) closePicker()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [pickerOpen])

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    await onAddComment?.(commentText.trim())
    setCommentText('')
    setSubmitting(false)
    commentInputRef.current?.focus()
  }

  const handleSaveEdit = async (commentId) => {
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

  const meals = [
    breakfast && { icon: '🍳', text: breakfast },
    lunch     && { icon: '🥗', text: lunch },
    dinner    && { icon: '🍝', text: dinner },
    drink     && { icon: '🍷', text: drink },
  ].filter(Boolean)

  return (
    <div className="feed-card" style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', borderTop: `4px solid ${NAVY}` }}>

      {/* ── Card header: author (left) + day/port/date/rating (right) ──────── */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

        {/* Left — avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: NAVY2, border: `2px solid ${BORDER}`,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {displayAvatar
              ? <img src={displayAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <span style={{ fontSize: 14, fontWeight: 700, color: WHITE, fontFamily: FONT_DISPLAY }}>{displayInitials}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY2, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {author ? author.name : displayName}
            </div>
            {author?.shipName && (
              <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{author.shipName}</div>
            )}
          </div>
          {author && (
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, background: GOLD + '18', border: `1px solid ${GOLD}40`, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
              Friend
            </span>
          )}
        </div>

        {/* Right — day badge + port + date */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          <div style={{ background: NAVY, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: WHITE, fontFamily: FONT_DISPLAY }}>{dayIndex + 1}</span>
          </div>
          {resolvedPort && (
            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY2, textAlign: 'right' }}>{resolvedPort}</div>
          )}
          {date && (
            <div style={{ fontSize: 11, color: MUTED, textAlign: 'right' }}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* ── Hero photo ─────────────────────────────────────────────────────── */}
      {photo && (
        <div style={{ width: '100%', maxHeight: 320, overflow: 'hidden', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <img
            src={photo.dataUrl}
            alt={photo.caption || resolvedPort || `Day ${dayIndex + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', maxHeight: 320 }}
          />
          {photo.caption && (
            <div style={{ padding: '8px 18px', background: '#FAFAF8', borderBottom: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
              {photo.caption}
            </div>
          )}
        </div>
      )}

      {/* ── Post body ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 18px' }}>
        {(highlights || rating > 0) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            {highlights && (
              <p style={{ margin: 0, flex: 1, fontSize: 14, color: TEXT, lineHeight: 1.7 }}>{highlights}</p>
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
            <span style={{ fontSize: 14 }}>🚤</span>
            <span style={{ fontSize: 13, color: TEXT }}><strong>Excursion:</strong> {activity}</span>
          </div>
        )}

        {(weather || []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {weather.map(wx => (
              <span key={wx} style={{ fontSize: 12, borderRadius: 20, padding: '3px 10px', ...(WX_STYLE[wx] || { background: '#F0F7FF', border: '1px solid #C7DCF5', color: '#2563EB' }) }}>
                {WX_EMOJI[wx] || '🌈'} {wx}
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
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{m.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Reactions + comment bar ─────────────────────────────────────────── */}
      <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* React button + long-press picker */}
        <div ref={pickerRef} style={{ position: 'relative', flexShrink: 0 }}>
          {pickerOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 10px)', left: 0,
              display: 'flex', gap: 6, alignItems: 'center',
              background: WHITE, borderRadius: 40, padding: '8px 12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
              border: `1px solid ${BORDER}`, zIndex: 50,
              animation: 'reactionPickerIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {REACTIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => handlePickReaction(r.id)}
                  title={r.label}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 4, borderRadius: '50%', fontSize: 28, lineHeight: 1,
                    transition: 'transform 0.15s',
                    transform: reactions?.[r.id]?.mine ? 'scale(1.25)' : 'scale(1)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.35)'}
                  onMouseLeave={e => e.currentTarget.style.transform = reactions?.[r.id]?.mine ? 'scale(1.25)' : 'scale(1)'}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleReactTap}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: myReaction ? 'var(--t-bg)' : 'transparent',
              border: `1.5px solid ${myReaction ? 'var(--t-primary)' : BORDER}`,
              borderRadius: 20, padding: '7px 14px', cursor: 'pointer',
              fontFamily: FONT_BODY, color: myReaction ? 'var(--t-primary)' : MUTED,
              fontSize: 13, fontWeight: 700,
              transition: 'border-color 0.15s, background 0.15s',
              userSelect: 'none', WebkitUserSelect: 'none',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{myReaction ? myReaction.emoji : '👍'}</span>
            {myReaction ? myReaction.label : 'React'}
          </button>
        </div>

        {/* Amalgamated reaction summary */}
        {totalReactions > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ display: 'flex' }}>
              {reactionSummary.slice(0, 3).map((r, i) => (
                <span key={r.id} style={{ fontSize: 15, lineHeight: 1, marginLeft: i === 0 ? 0 : -4, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}>{r.emoji}</span>
              ))}
            </div>
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{totalReactions}</span>
          </div>
        )}

        {/* Comment toggle */}
        <button
          onClick={() => {
            setShowComments(s => {
              if (!s) setTimeout(() => commentInputRef.current?.focus(), 60)
              return !s
            })
          }}
          style={{
            marginLeft: 'auto', background: 'none', flexShrink: 0,
            border: `1.5px solid ${showComments ? NAVY : BORDER}`,
            borderRadius: 20, padding: '7px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: showComments ? NAVY : MUTED, fontFamily: FONT_BODY,
            fontSize: 13, fontWeight: 700,
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          <span style={{ fontSize: 15 }}>💬</span>
          {(comments?.length || 0) > 0 ? comments.length : 'Comment'}
        </button>
      </div>

      {/* ── Comments thread ─────────────────────────────────────────────────── */}
      {showComments && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 16px 16px', background: '#FAFAFA' }}>
          {(comments?.length || 0) > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {comments.map(c => {
                const isOwn     = c.user_id === userId
                const isEditing = editingId === c.id
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 9 }}>
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
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(c.id) }
                              if (e.key === 'Escape') { setEditingId(null); setEditText('') }
                            }}
                            autoFocus rows={2}
                            style={{ flex: 1, border: `1.5px solid ${NAVY}`, borderRadius: 12, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5, color: TEXT }}
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
                        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: '4px 14px 14px 14px', padding: '8px 12px', display: 'inline-block', maxWidth: '100%' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY2, marginBottom: 3 }}>{c.authorName}</div>
                          <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.body}</div>
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 4, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(c.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && !isEditing && (
                          <button onClick={() => { setEditingId(c.id); setEditText(c.body) }}
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: 10, color: MUTED, cursor: 'pointer', fontFamily: FONT_BODY, fontWeight: 700, textDecoration: 'underline' }}>
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* New comment input */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: NAVY2, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(author ? author.avatarUrl : avatarUrl)
                ? <img src={author ? author.avatarUrl : avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 10, fontWeight: 700, color: WHITE }}>{author ? author.initials : initials}</span>
              }
            </div>
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment() } }}
              placeholder="Write a comment…"
              rows={1}
              style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '7px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5, color: TEXT, background: WHITE, transition: 'border-color 0.15s' }}
              onFocus={e => { e.target.style.borderColor = NAVY }}
              onBlur={e => { e.target.style.borderColor = BORDER }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
              style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: commentText.trim() ? NAVY : BORDER, color: commentText.trim() ? WHITE : MUTED, border: 'none', cursor: commentText.trim() ? 'pointer' : 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}
            >↑</button>
          </div>
        </div>
      )}

      {/* ── Card footer: view full day link (own posts only) ────────────────── */}
      {onViewDay && (
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${BORDER}`, background: '#F0F9FF', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onViewDay(dayIndex)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: NAVY2, fontFamily: FONT_BODY, fontWeight: 700, padding: 0 }}>
            View full day →
          </button>
        </div>
      )}
    </div>
  )
}
