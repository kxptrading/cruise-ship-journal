// pages/GalleryPage.tsx — All-voyages photo gallery organised by voyage

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import {
  WHITE, BORDER, MUTED, GOLD, NAVY2, TEAL, FONT_BODY, FONT_DISPLAY, BP,
} from '@/constants'
import { useW } from '@/context'
import { useVoyages } from '@/features/voyages/hooks'
import type { VoyageRow } from '@/features/voyages/hooks'
import { usePostsByVoyage } from '@/features/posts/hooks'
import { publicUrl } from '@/features/posts/mediaStorage'
import { PhotoLightbox } from '@/ui/MediaThumbnails'
import { EmptyState } from '@/components/ui/empty-state'
import { STAGGER, FADE_UP } from '@/lib/motion'
import FE from '@/components/FE'

// ── Photo parsing (same logic as MemoryGallery) ───────────────────────────────

interface PhotoEntry {
  path:     string
  dayLabel: string
  location: string
  caption:  string
}

function parsePhotos(posts: ReturnType<typeof usePostsByVoyage>['data']): PhotoEntry[] {
  return (posts ?? []).flatMap(post => {
    if (!(post.media_paths ?? []).length) return []
    const date = post.post_date
    const dayLabel = date
      ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : 'Undated'
    return (post.media_paths ?? []).map(path => ({
      path,
      dayLabel,
      location: post.location ?? '',
      caption:  post.title ?? post.body?.slice(0, 60) ?? '',
    }))
  })
}

// ── Photo grid ────────────────────────────────────────────────────────────────

function PhotoGrid({ entries, allPaths, onOpen }: {
  entries:  PhotoEntry[]
  allPaths: string[]
  onOpen:   (path: string) => void
}) {
  const w    = useW()
  const cols = w < BP.mobile ? 3 : 5

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5 }}>
      {entries.map(entry => (
        <motion.div
          key={entry.path}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.14 }}
          onClick={() => onOpen(entry.path)}
          style={{
            aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
            cursor: 'zoom-in', border: `1px solid ${BORDER}`, background: '#F3F4F6',
            position: 'relative',
          }}
        >
          <img
            src={publicUrl(entry.path)}
            alt={entry.caption}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {entry.location && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
              padding: '12px 5px 4px',
            }}>
              <div style={{ fontSize: 8, color: '#fff', fontFamily: FONT_BODY, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.location}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// ── Voyage gallery section ────────────────────────────────────────────────────

function VoyageSection({ voyage, defaultOpen }: { voyage: VoyageRow; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [lightbox, setLightbox] = useState<{ paths: string[]; idx: number } | null>(null)
  const [groupBy, setGroupBy]   = useState<'all' | 'day' | 'location'>('all')

  const { data: posts = [], isLoading } = usePostsByVoyage(voyage.id)

  const allEntries = parsePhotos(posts)
  const allPaths   = allEntries.map(e => e.path)
  const photoCount = allEntries.length

  const openLightbox = (path: string) => {
    const idx = allPaths.indexOf(path)
    setLightbox({ paths: allPaths, idx: idx >= 0 ? idx : 0 })
  }

  const title     = voyage.ship_name || 'Unnamed Voyage'
  const subtitle  = [voyage.cruise_line, voyage.departure_date?.slice(0, 4)].filter(Boolean).join(' · ')
  const dateRange = voyage.departure_date
    ? new Date(voyage.departure_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // Group helpers
  function groupBy_<T>(items: T[], key: keyof T): [string, T[]][] {
    const map = new Map<string, T[]>()
    for (const item of items) {
      const k = String(item[key] || 'Unknown')
      const arr = map.get(k) ?? []
      arr.push(item)
      map.set(k, arr)
    }
    return Array.from(map)
  }

  return (
    <>
      <div style={{
        background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16,
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {/* Voyage header — click to expand/collapse */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '0 18px', height: 80, textAlign: 'left',
          }}
        >
          {/* Cover thumbnail */}
          <div style={{
            width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
            flexShrink: 0, background: 'linear-gradient(135deg, var(--t-primary-dk), var(--t-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {voyage.cover_photo_url
              ? <img src={voyage.cover_photo_url} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <FE emoji="🚢" size={24} />
            }
          </div>

          {/* Voyage info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.2 }}>
              {title}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center', overflow: 'hidden' }}>
              {subtitle && <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</span>}
              {dateRange && <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, whiteSpace: 'nowrap', flexShrink: 0 }}>· {dateRange}</span>}
            </div>
          </div>

          {/* Photo count + chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {isLoading ? (
              <div className="skeleton-shimmer" style={{ width: 48, height: 18, borderRadius: 4 }} />
            ) : (
              <span style={{
                fontSize: 11, fontWeight: 700, fontFamily: FONT_BODY,
                background: photoCount > 0 ? `${GOLD}18` : '#F3F4F6',
                color: photoCount > 0 ? GOLD : MUTED,
                border: `1px solid ${photoCount > 0 ? GOLD + '40' : BORDER}`,
                borderRadius: 20, padding: '2px 10px',
              }}>
                {photoCount} photo{photoCount !== 1 ? 's' : ''}
              </span>
            )}
            <ChevronDown
              size={16} color={MUTED}
              style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
            />
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 18px 18px' }}>

                {isLoading && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                      <div key={i} className="skeleton-shimmer" style={{ aspectRatio: '1', borderRadius: 8 }} />
                    ))}
                  </div>
                )}


                {!isLoading && photoCount > 0 && (
                  <>
                    {/* Group filter */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      {([
                        { id: 'all' as const,      label: `All (${photoCount})` },
                        { id: 'day' as const,      label: 'By Day' },
                        { id: 'location' as const, label: 'By Location' },
                      ]).map(f => (
                        <button key={f.id} onClick={() => setGroupBy(f.id)} style={{
                          padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontFamily: FONT_BODY,
                          fontWeight: groupBy === f.id ? 700 : 400,
                          border: `1px solid ${groupBy === f.id ? GOLD : BORDER}`,
                          background: groupBy === f.id ? `${GOLD}18` : WHITE,
                          color: groupBy === f.id ? GOLD : MUTED,
                          transition: 'all 0.12s',
                        }}>
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* All flat */}
                    {groupBy === 'all' && (
                      <PhotoGrid entries={allEntries} allPaths={allPaths} onOpen={openLightbox} />
                    )}

                    {/* By day */}
                    {groupBy === 'day' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {groupBy_(allEntries, 'dayLabel').map(([day, entries]) => (
                          <div key={day}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                              <span style={{ fontSize: 13 }}>📅</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{day}</span>
                              <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>· {entries.length}</span>
                            </div>
                            <PhotoGrid entries={entries} allPaths={allPaths} onOpen={openLightbox} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* By location */}
                    {groupBy === 'location' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {groupBy_(allEntries, 'location').map(([loc, entries]) => {
                          const label = loc || 'Unknown location'
                          const isSea = label.toLowerCase().includes('sea')
                          return (
                            <div key={loc}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                                <span style={{ fontSize: 13 }}>{isSea ? '🌊' : '📍'}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: isSea ? '#60A5FA' : TEAL, fontFamily: FONT_BODY }}>{label}</span>
                                <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>· {entries.length}</span>
                              </div>
                              <PhotoGrid entries={entries} allPaths={allPaths} onOpen={openLightbox} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <PhotoLightbox
            paths={lightbox.paths}
            startAt={lightbox.idx}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── GalleryPage ───────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const w = useW()
  const { data: voyages = [], isLoading } = useVoyages()

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
          Gallery
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
          All your voyage photos, organised by trip.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ height: 82, borderRadius: 16 }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && voyages.length === 0 && (
        <EmptyState
          icon="📸"
          heading="No voyages yet"
          body="Create a voyage and start adding photos — they'll appear here organised by trip."
        />
      )}

      {/* Voyage sections */}
      {!isLoading && voyages.length > 0 && (
        <motion.div variants={STAGGER} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {voyages.map((voyage, i) => (
            <motion.div key={voyage.id} variants={FADE_UP}>
              <VoyageSection voyage={voyage} defaultOpen={false} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
