// ─────────────────────────────────────────────────────────────────────────────
// sections/feed/QuickComposer.tsx — Quick post composer
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { WHITE, BORDER, TEXT, MUTED, NAVY, BP, sty, FONT_BODY } from '../../constants'
import { useW } from '../../context'
import { Stars } from '../../components/ui'
import { addPhoto } from '../../lib/photoStorage'
import CameraCapture from '../../components/CameraCapture'
import type { DailyLog, ItineraryDay } from '../../types'

interface ImagePickerPos {
  top:  number
  left: number
}

interface Props {
  dailyLogs:  DailyLog[]
  itinerary:  ItineraryDay[]
  voyageId:   string | null
  userId:     string | null
  currentDay: number | null
  onChange:   (updated: DailyLog[]) => void
  showToast?: (msg: string) => void
}

export default function QuickComposer({ dailyLogs, itinerary, voyageId, userId, currentDay, onChange, showToast }: Props) {
  const w = useW()

  const [composing,           setComposing]           = useState<boolean>(false)
  const [composeDay,          setComposeDay]          = useState<string>('')
  const [composeText,         setComposeText]         = useState<string>('')
  const [composeRating,       setComposeRating]       = useState<number>(0)
  const [composeImage,        setComposeImage]        = useState<File | null>(null)
  const [composeImagePreview, setComposeImagePreview] = useState<string>('')
  const [showImagePicker,     setShowImagePicker]     = useState<ImagePickerPos | null>(null)
  const [showCamera,          setShowCamera]          = useState<boolean>(false)

  const textRef       = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const resetComposer = () => {
    setComposing(false)
    setComposeText('')
    setComposeRating(0)
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
    window.setTimeout(() => textRef.current?.focus(), 60)
  }

  const handlePost = async () => {
    const idx = parseInt(composeDay, 10)
    if (!composeText.trim() || isNaN(idx) || idx < 0 || idx >= dailyLogs.length) return
    const updated  = [...dailyLogs]
    const wasFirst = !dailyLogs.some(d => d.highlights || d.bestMoment)
    updated[idx] = {
      ...updated[idx],
      highlights: composeText.trim(),
      ...(composeRating > 0 ? { rating: composeRating } : {}),
      isPublic: true,
    }
    onChange(updated)
    if (composeImage && voyageId && userId) {
      try { await addPhoto(idx + 1, composeImage, { voyageId, userId }) } catch (_) { /* non-fatal */ }
    }
    if (wasFirst && showToast) showToast(`Day ${idx + 1} logged! ⚓`)
    resetComposer()
  }

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
      {!composing ? (
        /* ── Collapsed pill ── */
        <div
          onClick={handleOpen}
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'text', background: 'linear-gradient(135deg, var(--t-bg), var(--t-bg))' }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
            ⚓
          </div>
          <div style={{ flex: 1, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 22, padding: '10px 18px', fontSize: 14, color: MUTED, cursor: 'text', userSelect: 'none', fontFamily: FONT_BODY }}>
            What happened today?
          </div>
        </div>
      ) : (
        /* ── Expanded composer ── */
        <div style={{ padding: 16, boxShadow: '0 4px 20px var(--t-btn-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, marginTop: 2 }}>
              ⚓
            </div>
            <textarea
              ref={textRef}
              value={composeText}
              onChange={e => setComposeText(e.target.value)}
              placeholder="Share what happened today — highlights, discoveries, experiences..."
              rows={4}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', resize: 'none', lineHeight: 1.7, color: TEXT, background: 'transparent', boxSizing: 'border-box', width: '100%' }}
            />
          </div>

          {/* Image preview */}
          {composeImagePreview && (
            <div style={{ position: 'relative', marginTop: 10, borderRadius: 12, overflow: 'hidden', display: 'inline-block' }}>
              <img src={composeImagePreview} alt="Preview" style={{ maxHeight: 180, maxWidth: '100%', display: 'block', borderRadius: 12 }} />
              <button
                onClick={() => { URL.revokeObjectURL(composeImagePreview); setComposeImage(null); setComposeImagePreview('') }}
                style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: WHITE, border: 'none', borderRadius: '50%', width: 24, height: 24, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              if (composeImagePreview) URL.revokeObjectURL(composeImagePreview)
              setComposeImage(file)
              setComposeImagePreview(URL.createObjectURL(file))
              e.target.value = ''
            }}
          />

          {/* Camera capture modal */}
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

          {/* Toolbar */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: w < BP.mobile ? 8 : 14, flexWrap: 'wrap' }}>

              {/* Add photo button + popover */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const menuW = 178
                    const safeLeft = Math.min(rect.left, Math.max(8, window.innerWidth - menuW - 8))
                    setShowImagePicker(p => p ? null : { top: rect.bottom + 6, left: safeLeft })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: composeImage ? 'var(--t-bg)' : 'none',
                    border: `1px solid ${composeImage ? 'var(--t-primary)' : BORDER}`,
                    borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                    fontSize: 13, fontFamily: FONT_BODY,
                    color: composeImage ? 'var(--t-primary)' : MUTED,
                  }}
                >
                  📷 {composeImage ? 'Change Photo' : 'Add Photo'}
                  <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.6 }}>▾</span>
                </button>

                {showImagePicker && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowImagePicker(null)} />
                    <div style={{
                      position: 'fixed', top: showImagePicker.top, left: showImagePicker.left, zIndex: 100,
                      background: WHITE, border: `1px solid ${BORDER}`,
                      borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      overflow: 'hidden', minWidth: 170,
                    }}>
                      <button
                        onClick={() => { setShowImagePicker(null); imageInputRef.current?.click() }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '11px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: TEXT, textAlign: 'left' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F4F4F2' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        <span style={{ fontSize: 16 }}>🖼️</span> Upload Image
                      </button>
                      <div style={{ height: 1, background: BORDER }} />
                      <button
                        onClick={() => { setShowImagePicker(null); setShowCamera(true) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '11px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: TEXT, textAlign: 'left' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F4F4F2' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        <span style={{ fontSize: 16 }}>📸</span> Take a Photo
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Day picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Day</span>
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

              {/* Star rating */}
              <Stars value={composeRating} onChange={setComposeRating} />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetComposer}
                style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={!composeText.trim() || composeDay === ''}
                className="btn-primary"
                style={{
                  ...sty.btn, padding: '7px 22px', fontSize: 13,
                  cursor: composeText.trim() && composeDay !== '' ? 'pointer' : 'not-allowed',
                  opacity: composeText.trim() && composeDay !== '' ? 1 : 0.45,
                  transition: 'opacity 0.15s, filter 0.15s, transform 0.15s',
                }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
