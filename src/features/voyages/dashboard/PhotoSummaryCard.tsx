// dashboard/PhotoSummaryCard.tsx — Memories captured stat card with thumbnail strip

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, MUTED, GOLD, NAVY2, FONT_BODY, FONT_DISPLAY } from '@/constants'
import { publicUrl } from '@/features/posts/mediaStorage'
import { usePostsByVoyage } from '@/features/posts/hooks'
import { PhotoLightbox } from '@/ui/MediaThumbnails'
import { Camera, Images } from 'lucide-react'

interface Props {
  voyageId:   string | null | undefined
  onViewGallery?: () => void
}

export default function PhotoSummaryCard({ voyageId, onViewGallery }: Props) {
  const { data: posts = [], isLoading } = usePostsByVoyage(voyageId)
  const [lightbox, setLightbox] = useState<{ paths: string[]; idx: number } | null>(null)

  const postsWithPhotos = posts.filter(p => (p.media_paths ?? []).length > 0)
  const allPaths        = postsWithPhotos.flatMap(p => p.media_paths)
  const totalPhotos     = allPaths.length
  const previewPaths    = allPaths.slice(0, 5)

  if (isLoading || totalPhotos === 0) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          background:   WHITE,
          border:       `1px solid ${BORDER}`,
          borderRadius: 16,
          padding:      '14px 16px',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={20} strokeWidth={1.8} color={MUTED} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                {totalPhotos}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT_BODY }}>
                Memories Captured
              </div>
            </div>
          </div>
          {onViewGallery && (
            <button
              onClick={onViewGallery}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t-primary)', fontFamily: FONT_BODY, fontWeight: 600, padding: 0 }}
            >
              View Gallery →
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {previewPaths.map((path, i) => {
            const isLast    = i === previewPaths.length - 1
            const remaining = totalPhotos - previewPaths.length
            return (
              <motion.div
                key={path}
                whileHover={{ scale: 1.04 }}
                onClick={() => setLightbox({ paths: allPaths, idx: i })}
                style={{
                  position:     'relative',
                  width:        72,
                  height:       72,
                  borderRadius: 10,
                  overflow:     'hidden',
                  flexShrink:   0,
                  cursor:       'zoom-in',
                  border:       `1px solid ${BORDER}`,
                  background:   '#F3F4F6',
                }}
              >
                <img
                  src={publicUrl(path)}
                  alt={`Memory ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {isLast && remaining > 0 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: FONT_BODY,
                  }}>
                    +{remaining}
                  </div>
                )}
              </motion.div>
            )
          })}

          {/* Gold "View all" tile */}
          {onViewGallery && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              onClick={onViewGallery}
              style={{
                width: 72, height: 72, borderRadius: 10, flexShrink: 0,
                background: `${GOLD}18`, border: `1.5px dashed ${GOLD}60`,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                fontSize: 11, color: GOLD, fontWeight: 700, fontFamily: FONT_BODY,
              }}
            >
              <Images size={18} strokeWidth={1.8} />
              Gallery
            </motion.button>
          )}
        </div>
      </motion.div>

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
