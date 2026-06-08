// dashboard/HighlightsGallery.tsx — Auto-curated voyage highlight categories
//
// Each category auto-selects a photo via keyword heuristics.
// Users can override any slot by clicking it to open a photo picker.
// Selections are persisted in localStorage keyed by voyageId.

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { WHITE, BORDER, MUTED, GOLD, NAVY2, FONT_DISPLAY, FONT_BODY, BP } from '@/constants'
import { useW } from '@/context'
import { usePostsByVoyage } from '@/features/posts/hooks'
import { publicUrl } from '@/features/posts/mediaStorage'
import type { PostRow } from '@/features/posts/hooks'

// ── Category definitions ──────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'best-view',    emoji: '🏔',   label: 'Best View',     keywords: ['view', 'scenery', 'landscape', 'fjord', 'mountain', 'panorama', 'vista'] },
  { id: 'best-sunset',  emoji: '🌅',   label: 'Best Sunset',   keywords: ['sunset', 'sunrise', 'dusk', 'dawn', 'golden hour', 'sky'] },
  { id: 'best-meal',    emoji: '🍽️',   label: 'Best Meal',     keywords: ['meal', 'dinner', 'lunch', 'breakfast', 'restaurant', 'food', 'dining', 'ate', 'buffet'] },
  { id: 'best-family',  emoji: '👨‍👩‍👧',  label: 'Best Family',  keywords: ['family', 'together', 'kids', 'children', 'group', 'friends', 'everyone'] },
  { id: 'best-ship',    emoji: '🚢',   label: 'Best Ship',     keywords: ['ship', 'cabin', 'deck', 'pool', 'atrium', 'cruise', 'onboard', 'lobby'] },
  { id: 'best-port',    emoji: '⚓',   label: 'Best Port',     keywords: ['port', 'harbour', 'harbor', 'dock', 'ashore', 'excursion', 'town', 'village'] },
  { id: 'best-show',    emoji: '🎭',   label: 'Best Show',     keywords: ['show', 'entertainment', 'theatre', 'theater', 'music', 'performer', 'concert', 'dance'] },
]

// ── Auto-selection logic ──────────────────────────────────────────────────────

function keywordMatch(post: PostRow, keywords: string[]): boolean {
  const text = `${post.title ?? ''} ${post.body} ${post.location ?? ''}`.toLowerCase()
  return keywords.some(k => text.includes(k))
}

function autoSelectAll(posts: PostRow[]): Record<string, string | null> {
  const photoPosts = posts.filter(p => (p.media_paths ?? []).length > 0)
  const potd       = photoPosts.find(p => p.metadata?.is_photo_of_day)
  const topRated   = [...photoPosts].sort((a, b) =>
    ((b.metadata?.rating as number) ?? 0) - ((a.metadata?.rating as number) ?? 0)
  )[0]

  const result: Record<string, string | null> = {}
  for (const cat of CATEGORIES) {
    if (cat.id === 'best-view') {
      result[cat.id] = potd?.media_paths[0]
        ?? photoPosts.find(p => keywordMatch(p, cat.keywords))?.media_paths[0]
        ?? topRated?.media_paths[0]
        ?? null
    } else if (cat.id === 'best-port') {
      result[cat.id] = topRated?.media_paths[0]
        ?? photoPosts.find(p => keywordMatch(p, cat.keywords))?.media_paths[0]
        ?? null
    } else {
      result[cat.id] = photoPosts.find(p => keywordMatch(p, cat.keywords))?.media_paths[0] ?? null
    }
  }
  return result
}

// ── Photo picker modal ────────────────────────────────────────────────────────

interface PickerProps {
  allPaths:   string[]
  current:    string | null
  catLabel:   string
  catEmoji:   string
  onPick:     (path: string) => void
  onClose:    () => void
}

function PhotoPicker({ allPaths, current, catLabel, catEmoji, onPick, onClose }: PickerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 env(safe-area-inset-bottom)' }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{ background: WHITE, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Handle + header */}
        <div style={{ padding: '14px 20px 12px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
              {catEmoji} {catLabel}
            </div>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, marginTop: 1 }}>
              Tap a photo to set it as your {catLabel.toLowerCase()}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>
            <X size={16} />
          </button>
        </div>

        {/* Photo grid */}
        <div style={{ overflowY: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {allPaths.map(path => {
            const isSelected = path === current
            return (
              <motion.div
                key={path}
                whileHover={{ scale: 1.03 }}
                onClick={() => { onPick(path); onClose() }}
                style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: isSelected ? `2.5px solid ${GOLD}` : `1px solid ${BORDER}` }}
              >
                <img src={publicUrl(path)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {isSelected && (
                  <div style={{ position: 'absolute', inset: 0, background: `${GOLD}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: GOLD, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} color="#fff" strokeWidth={2.5} />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── HighlightsGallery ─────────────────────────────────────────────────────────

interface Props {
  voyageId: string
}

const storageKey = (id: string) => `dd_highlights_${id}`

export default function HighlightsGallery({ voyageId }: Props) {
  const { data: posts = [] } = usePostsByVoyage(voyageId)
  const w = useW()

  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey(voyageId)) ?? '{}') }
    catch { return {} }
  })
  const [picker, setPicker] = useState<{ catId: string; catLabel: string; catEmoji: string } | null>(null)

  useEffect(() => {
    localStorage.setItem(storageKey(voyageId), JSON.stringify(overrides))
  }, [overrides, voyageId])

  const allPaths = useMemo(
    () => posts.flatMap(p => p.media_paths ?? []).filter(Boolean),
    [posts]
  )

  const autoSelections = useMemo(() => autoSelectAll(posts), [posts])

  if (allPaths.length === 0) return null

  const cardW  = w < BP.mobile ? 130 : 150
  const cardH  = w < BP.mobile ? 150 : 170
  const photoH = cardH - 42

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        {/* Header */}
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            Voyage Highlights
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
            Auto-curated from your posts · tap any card to change
          </p>
        </div>

        {/* Horizontal scroll row */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {CATEGORIES.map(cat => {
            const path     = overrides[cat.id] ?? autoSelections[cat.id] ?? null
            const photoUrl = path ? publicUrl(path) : null
            const isEmpty  = !photoUrl

            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ duration: 0.15 }}
                onClick={() => setPicker({ catId: cat.id, catLabel: cat.label, catEmoji: cat.emoji })}
                style={{
                  flexShrink:   0,
                  width:        cardW,
                  height:       cardH,
                  borderRadius: 14,
                  border:       isEmpty ? `1.5px dashed ${BORDER}` : `1px solid ${BORDER}`,
                  background:   WHITE,
                  cursor:       'pointer',
                  padding:      0,
                  overflow:     'hidden',
                  textAlign:    'left',
                  position:     'relative',
                  boxShadow:    '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                {/* Photo area */}
                <div style={{ width: '100%', height: photoH, overflow: 'hidden', background: isEmpty ? '#F3F4F6' : undefined, position: 'relative' }}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={cat.label}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 28, opacity: 0.3 }}>{cat.emoji}</span>
                      <span style={{ fontSize: 10, color: MUTED, fontFamily: FONT_BODY }}>Tap to pick</span>
                    </div>
                  )}
                  {/* Gradient vignette over photo */}
                  {photoUrl && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none' }} />
                  )}
                  {/* Override indicator */}
                  {overrides[cat.id] && (
                    <div style={{ position: 'absolute', top: 6, right: 6, background: `${GOLD}CC`, borderRadius: 6, padding: '1px 5px', fontSize: 8, fontWeight: 700, color: '#fff', fontFamily: FONT_BODY, letterSpacing: '0.04em' }}>
                      CUSTOM
                    </div>
                  )}
                </div>

                {/* Label row */}
                <div style={{ padding: '7px 10px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY, lineHeight: 1.2 }}>{cat.label}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Photo picker sheet */}
      <AnimatePresence>
        {picker && (
          <PhotoPicker
            allPaths={allPaths}
            current={overrides[picker.catId] ?? autoSelections[picker.catId] ?? null}
            catLabel={picker.catLabel}
            catEmoji={picker.catEmoji}
            onPick={path => setOverrides(prev => ({ ...prev, [picker.catId]: path }))}
            onClose={() => setPicker(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
