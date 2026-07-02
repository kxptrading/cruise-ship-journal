// ─────────────────────────────────────────────────────────────────────────────
// sections/feed/QuickComposer.tsx — Animated post composer
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, TEXT, MUTED, NAVY, NAVY2, BP, sty, FONT_BODY } from '../../constants'
import { useW } from '../../context'
import { Stars } from '../../components/ui'
import { addPhoto } from '../../lib/photoStorage'
import CameraCapture from '../../components/CameraCapture'
import type { DailyLog, ItineraryDay } from '../../types'
import FE from '../../components/FE'
import { POST_TEMPLATES, type PostTemplate } from './templates'
import MentionInput from '../social/MentionInput'

const MOODS = ['😄', '😌', '😲', '😴', '😍'] as const
type Mood = typeof MOODS[number]

interface Props {
  dailyLogs:   DailyLog[]
  itinerary:   ItineraryDay[]
  voyageId:    string | null
  userId:      string | null
  currentDay:  number | null
  onChange:    (updated: DailyLog[]) => void
  showToast?:  (msg: string) => void
  avatarUrl?:  string
  initials?:   string
}

export default function QuickComposer({ dailyLogs, itinerary, voyageId, userId, currentDay, onChange, showToast, avatarUrl, initials }: Props) {
  const w = useW()

  const [composing,           setComposing]           = useState<boolean>(false)
  const [composeDay,          setComposeDay]          = useState<string>('')
  const [composeText,         setComposeText]         = useState<string>('')
  const [composeRating,       setComposeRating]       = useState<number>(0)
  const [composeMood,         setComposeMood]         = useState<Mood | null>(null)
  const [composeImage,        setComposeImage]        = useState<File | null>(null)
  const [composeImagePreview, setComposeImagePreview] = useState<string>('')
  const [showImagePicker,     setShowImagePicker]     = useState<{ top: number; left: number } | null>(null)
  const [showCamera,          setShowCamera]          = useState<boolean>(false)
  const [isDragging,          setIsDragging]          = useState<boolean>(false)

  const textRef       = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const resetComposer = () => {
    setComposing(false)
    setComposeText('')
    setComposeRating(0)
    setComposeMood(null)
    setComposeDay('')
    if (composeImagePreview) URL.revokeObjectURL(composeImagePreview)
    setComposeImage(null)
    setComposeImagePreview('')
  }

  const handleOpen = () => {
    setComposing(true)
    if (currentDay) {
      const todayIdx = currentDay - 1
      if (todayIdx >= 0 && todayIdx < dailyLogs.length) setComposeDay(String(todayIdx))
    }
    window.setTimeout(() => textRef.current?.focus(), 80)
  }

  // One-tap template fills the box with a prompt skeleton, then drops the cursor
  // at the end so the user can start filling it in.
  const applyTemplate = (t: PostTemplate) => {
    setComposeText(t.body)
    window.setTimeout(() => {
      const el = textRef.current
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    }, 0)
  }

  const handlePost = async () => {
    const idx = parseInt(composeDay, 10)
    if (!composeText.trim() || isNaN(idx) || idx < 0 || idx >= dailyLogs.length) return
    const text     = composeMood ? `${composeMood} ${composeText.trim()}` : composeText.trim()
    const updated  = [...dailyLogs]
    const wasFirst = !dailyLogs.some(d => d.highlights || d.bestMoment)
    updated[idx] = { ...updated[idx], highlights: text, ...(composeRating > 0 ? { rating: composeRating } : {}), isPublic: true }
    onChange(updated)
    if (composeImage && voyageId && userId) {
      try { await addPhoto(idx + 1, composeImage, { voyageId, userId }) } catch (_) { /* non-fatal */ }
    }
    if (wasFirst && showToast) showToast(`Day ${idx + 1} logged! ⚓`)
    resetComposer()
  }

  // ── Drag-and-drop photo ────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (composing) setIsDragging(true)
  }, [composing])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!composing) { handleOpen(); return }
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (!file) return
    if (composeImagePreview) URL.revokeObjectURL(composeImagePreview)
    setComposeImage(file)
    setComposeImagePreview(URL.createObjectURL(file))
  }, [composing, composeImagePreview]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (composeImagePreview) URL.revokeObjectURL(composeImagePreview)
    setComposeImage(file)
    setComposeImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const canPost = composeText.trim() && composeDay !== ''

  return (
    <motion.div
      layout
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background:   WHITE,
        border:       `1.5px solid ${isDragging ? 'var(--t-primary)' : BORDER}`,
        borderRadius: 20,
        marginBottom: 16,
        overflow:     'hidden',
        transition:   'border-color 0.15s',
        boxShadow:    isDragging ? '0 0 0 3px var(--t-primary)20' : 'none',
      }}
    >
      {/* ── Collapsed pill ── */}
      {!composing && (
        <div
          onClick={handleOpen}
          style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'text' }}
        >
          {/* Avatar */}
          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${BORDER}` }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <span style={{ fontSize: 14, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>{initials || '⚓'}</span>
            }
          </div>
          <div style={{ flex: 1, background: '#F4F3EF', border: `1px solid ${BORDER}`, borderRadius: 22, padding: '10px 18px', fontSize: 14, color: MUTED, userSelect: 'none', fontFamily: FONT_BODY }}>
            Share your day…
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['📷', '📅'].map(e => (
              <div key={e} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F4F3EF', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                <FE emoji={e} size={16} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Expanded composer ── */}
      <AnimatePresence>
        {composing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ padding: 16 }}
          >
            {/* Top row: avatar + textarea */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, border: `2px solid ${BORDER}` }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <span style={{ fontSize: 14, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>{initials || '⚓'}</span>
                }
              </div>
              <MentionInput
                ref={textRef}
                value={composeText}
                onChange={setComposeText}
                placeholder={composeMood ? `${composeMood} What happened today?` : 'Share what happened today — highlights, discoveries, experiences...'}
                rows={4}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', resize: 'none', lineHeight: 1.7, color: TEXT, background: 'transparent', boxSizing: 'border-box', width: '100%' }}
              />
            </div>

            {/* Template chips — only while the box is empty, so they never
                overwrite what's been typed. Mirrors the full post composer. */}
            {!composeText.trim() && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 52 }}>
                {POST_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '4px 11px', cursor: 'pointer', fontSize: 12.5, fontFamily: FONT_BODY, color: NAVY, fontWeight: 600 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER }}
                  >
                    <FE emoji={t.emoji} size={13} /> {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Drag-drop hint */}
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ border: `2px dashed var(--t-primary)`, borderRadius: 12, padding: '20px', textAlign: 'center', fontSize: 13, color: 'var(--t-primary)', fontFamily: FONT_BODY, marginTop: 8, background: 'var(--t-bg)' }}
              >
                Drop photo here
              </motion.div>
            )}

            {/* Image preview */}
            {composeImagePreview && (
              <div style={{ position: 'relative', marginTop: 10, borderRadius: 12, overflow: 'hidden', display: 'inline-block' }}>
                <img src={composeImagePreview} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', display: 'block', borderRadius: 12 }} />
                <button
                  onClick={() => { URL.revokeObjectURL(composeImagePreview); setComposeImage(null); setComposeImagePreview('') }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: WHITE, border: 'none', borderRadius: '50%', width: 24, height: 24, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >✕</button>
              </div>
            )}

            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

            {showCamera && (
              <CameraCapture
                onCapture={file => {
                  if (composeImagePreview) URL.revokeObjectURL(composeImagePreview)
                  setComposeImage(file)
                  setComposeImagePreview(URL.createObjectURL(file))
                  setShowCamera(false)
                }}
                onCancel={() => setShowCamera(false)}
              />
            )}

            {/* ── Toolbar ── */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
              {/* Mood selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT_BODY, flexShrink: 0 }}>Mood</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {MOODS.map(mood => (
                    <motion.button
                      key={mood}
                      onClick={() => setComposeMood(m => m === mood ? null : mood)}
                      whileHover={{ scale: 1.25 }}
                      whileTap={{ scale: 0.85 }}
                      style={{
                        background:  composeMood === mood ? 'var(--t-bg)' : 'none',
                        border:      `1.5px solid ${composeMood === mood ? 'var(--t-primary)' : BORDER}`,
                        borderRadius: '50%', width: 36, height: 36,
                        cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.12s, background 0.12s',
                        flexShrink: 0,
                      }}
                    >
                      <FE emoji={mood} size={20} />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Controls row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: w < BP.mobile ? 8 : 12, flexWrap: 'wrap' }}>

                  {/* Photo button */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const menuW = 180
                        const safeLeft = Math.min(rect.left, Math.max(8, window.innerWidth - menuW - 8))
                        setShowImagePicker(p => p ? null : { top: rect.bottom + 6, left: safeLeft })
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: composeImage ? 'var(--t-bg)' : 'none', border: `1px solid ${composeImage ? 'var(--t-primary)' : BORDER}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: composeImage ? 'var(--t-primary)' : MUTED }}
                    >
                      <FE emoji="📷" size={13} /> {composeImage ? 'Change' : 'Add Photo'}
                      <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.6 }}>▾</span>
                    </button>

                    {showImagePicker && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowImagePicker(null)} />
                        <div style={{ position: 'fixed', top: showImagePicker.top, left: showImagePicker.left, zIndex: 100, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 170 }}>
                          <button onClick={() => { setShowImagePicker(null); imageInputRef.current?.click() }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '11px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: TEXT, textAlign: 'left' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F4F4F2' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                            <FE emoji="🖼️" size={16} /> Upload Image
                          </button>
                          <div style={{ height: 1, background: BORDER }} />
                          <button onClick={() => { setShowImagePicker(null); setShowCamera(true) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '11px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: TEXT, textAlign: 'left' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F4F4F2' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                            <FE emoji="📸" size={16} /> Take a Photo
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Day/port picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT_BODY }}>Day</span>
                    <select
                      value={composeDay}
                      onChange={e => setComposeDay(e.target.value)}
                      style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 10px', fontSize: 13, fontFamily: 'inherit', color: TEXT, background: WHITE, outline: 'none' }}
                    >
                      <option value="">Select…</option>
                      {dailyLogs.map((log, i) => {
                        const port = log.port || itinerary[i]?.port || ''
                        return (
                          <option key={i} value={i}>
                            Day {i + 1}{port ? ` · ${port.split(',')[0]}` : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Stars */}
                  <Stars value={composeRating} onChange={setComposeRating} />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={resetComposer}
                    style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>
                    Cancel
                  </button>
                  <motion.button
                    onClick={handlePost}
                    disabled={!canPost}
                    whileTap={canPost ? { scale: 0.95 } : undefined}
                    className="btn-primary"
                    style={{ ...sty.btn, padding: '7px 22px', fontSize: 13, cursor: canPost ? 'pointer' : 'not-allowed', opacity: canPost ? 1 : 0.45 }}
                  >
                    Post
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
