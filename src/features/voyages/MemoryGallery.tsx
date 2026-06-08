// features/voyages/MemoryGallery.tsx — Grouped photo gallery for a voyage

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, MUTED, GOLD, NAVY2, TEAL, FONT_BODY, FONT_DISPLAY, BP } from '@/constants'
import { useW } from '@/context'
import { usePostsByVoyage } from '@/features/posts/hooks'
import { publicUrl } from '@/features/posts/mediaStorage'
import { PhotoLightbox } from '@/ui/MediaThumbnails'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton'
import { STAGGER, FADE_UP } from '@/lib/motion'
import type { PostRow } from '@/features/posts/hooks'

type FilterMode = 'all' | 'day' | 'location'

interface PhotoEntry {
  path:     string
  postId:   string
  dayLabel: string
  location: string
  caption:  string
  isPoD:    boolean       // Photo of the Day
}

function parseGroup(posts: PostRow[]): PhotoEntry[] {
  return posts.flatMap(post => {
    if (!(post.media_paths ?? []).length) return []
    const meta   = post.metadata ?? {}
    const isPoD  = meta.is_photo_of_day === true
    const date   = post.post_date
    const dayLabel = date
      ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : 'Undated'
    return (post.media_paths ?? []).map(path => ({
      path,
      postId:   post.id,
      dayLabel,
      location: post.location ?? 'Unknown',
      caption:  post.title ?? post.body.slice(0, 60),
      isPoD,
    }))
  })
}

function groupByKey<T>(items: T[], key: keyof T): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = String(item[key])
    const arr = map.get(k) ?? []
    arr.push(item)
    map.set(k, arr)
  }
  return map
}

interface PhotoGridProps {
  entries:  PhotoEntry[]
  allPaths: string[]
  onOpen:   (path: string) => void
}

function PhotoGrid({ entries, allPaths, onOpen }: PhotoGridProps) {
  const w = useW()
  const cols = w < BP.mobile ? 3 : 4
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
      {entries.map(entry => (
        <motion.div
          key={entry.path}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.15 }}
          onClick={() => onOpen(entry.path)}
          style={{
            position:     'relative',
            aspectRatio:  '1',
            borderRadius: 10,
            overflow:     'hidden',
            cursor:       'zoom-in',
            border:       `1px solid ${BORDER}`,
            background:   '#F3F4F6',
          }}
        >
          <img
            src={publicUrl(entry.path)}
            alt={entry.caption}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Photo of the Day badge */}
          {entry.isPoD && (
            <div style={{
              position: 'absolute', top: 5, left: 5,
              background: 'rgba(201,162,39,0.9)',
              color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: FONT_BODY,
              padding: '2px 6px', borderRadius: 20, letterSpacing: '0.04em',
            }}>
              ⭐ POTD
            </div>
          )}
          {/* Caption on hover via CSS gradient */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))',
            padding: '16px 6px 5px',
          }}>
            <div style={{ fontSize: 9, color: '#fff', fontFamily: FONT_BODY, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.location}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface Props {
  voyageId: string
}

export default function MemoryGallery({ voyageId }: Props) {
  const { data: posts = [], isLoading } = usePostsByVoyage(voyageId)
  const [filter,  setFilter]  = useState<FilterMode>('all')
  const [lightbox, setLightbox] = useState<{ paths: string[]; idx: number } | null>(null)

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><SkeletonCard /><SkeletonCard /></div>

  const allEntries = parseGroup(posts)
  const allPaths   = allEntries.map(e => e.path)

  if (allEntries.length === 0) {
    return (
      <EmptyState
        icon="📸"
        heading="No photos yet"
        body="Add photos to your posts — they'll appear here grouped by day and location."
      />
    )
  }

  const openLightbox = (path: string) => {
    const idx = allPaths.indexOf(path)
    setLightbox({ paths: allPaths, idx: idx >= 0 ? idx : 0 })
  }

  const FILTERS: { id: FilterMode; label: string }[] = [
    { id: 'all',      label: `All (${allEntries.length})` },
    { id: 'day',      label: 'By Day' },
    { id: 'location', label: 'By Location' },
  ]

  return (
    <>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
              Memory Gallery
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
              {allEntries.length} photo{allEntries.length !== 1 ? 's' : ''} from this voyage
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === f.id ? GOLD : BORDER}`,
                background: filter === f.id ? `${GOLD}18` : WHITE,
                color: filter === f.id ? GOLD : MUTED,
                fontSize: 12, fontWeight: filter === f.id ? 700 : 400,
                fontFamily: FONT_BODY, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* All photos flat grid */}
        {filter === 'all' && (
          <motion.div variants={STAGGER} initial="hidden" animate="visible">
            <motion.div variants={FADE_UP}>
              <PhotoGrid entries={allEntries} allPaths={allPaths} onOpen={openLightbox} />
            </motion.div>
          </motion.div>
        )}

        {/* Grouped by day */}
        {filter === 'day' && (
          <motion.div variants={STAGGER} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Array.from(groupByKey(allEntries, 'dayLabel')).map(([day, entries]) => (
              <motion.div key={day} variants={FADE_UP}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14 }}>📅</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{day}</span>
                  <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>· {entries.length} photo{entries.length !== 1 ? 's' : ''}</span>
                </div>
                <PhotoGrid entries={entries} allPaths={allPaths} onOpen={openLightbox} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Grouped by location */}
        {filter === 'location' && (
          <motion.div variants={STAGGER} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Array.from(groupByKey(allEntries, 'location')).map(([loc, entries]) => {
              const isSea = loc.toLowerCase().includes('sea') || loc === 'Unknown'
              return (
                <motion.div key={loc} variants={FADE_UP}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 14 }}>{isSea ? '🌊' : '📍'}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isSea ? '#60A5FA' : TEAL, fontFamily: FONT_BODY }}>{loc}</span>
                    <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>· {entries.length} photo{entries.length !== 1 ? 's' : ''}</span>
                  </div>
                  <PhotoGrid entries={entries} allPaths={allPaths} onOpen={openLightbox} />
                </motion.div>
              )
            })}
          </motion.div>
        )}
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
