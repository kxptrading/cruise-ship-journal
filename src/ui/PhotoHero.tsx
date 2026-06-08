// ui/PhotoHero.tsx — Full-width hero image card with overlay, badge, and lightbox

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { publicUrl } from '@/features/posts/mediaStorage'
import { PhotoLightbox } from './MediaThumbnails'
import { FONT_BODY } from '@/constants'

// Cruise-themed gradient placeholders — used when no photo is available
const DAY_GRADIENTS: Record<string, string> = {
  'at-sea':         'linear-gradient(135deg, #0C4A6E 0%, #0369A1 50%, #0EA5E9 100%)',
  'port':           'linear-gradient(135deg, #064E3B 0%, #059669 50%, #34D399 100%)',
  'embarkation':    'linear-gradient(135deg, #1E3A5F 0%, #1B3A5C 50%, #C9A227 100%)',
  'disembarkation': 'linear-gradient(135deg, #4A1942 0%, #7C3AED 50%, #A78BFA 100%)',
  'default':        'linear-gradient(135deg, var(--t-primary-dk) 0%, var(--t-primary) 100%)',
}

interface Props {
  paths:        string[]           // storage paths (converted via publicUrl)
  caption?:     string
  badge?:       string             // e.g., "⭐ Photo of the Day"
  dayType?:     keyof typeof DAY_GRADIENTS
  height?:      number
  borderRadius?: number
}

export default function PhotoHero({ paths, caption, badge, dayType = 'default', height = 180, borderRadius = 14 }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [imgError,    setImgError]    = useState(false)

  const hasPhoto  = paths.length > 0 && !imgError
  const overflow  = paths.length - 1
  const heroUrl   = hasPhoto ? publicUrl(paths[0]) : null
  const gradient  = DAY_GRADIENTS[dayType] ?? DAY_GRADIENTS.default

  return (
    <>
      <div
        role="img"
        aria-label={caption ?? 'Photo'}
        onClick={() => hasPhoto && setLightboxIdx(0)}
        style={{
          position:     'relative',
          height,
          borderRadius,
          overflow:     'hidden',
          cursor:       hasPhoto ? 'zoom-in' : 'default',
          background:   gradient,
          flexShrink:   0,
        }}
      >
        {/* Photo */}
        {heroUrl && (
          <img
            src={heroUrl}
            alt={caption ?? ''}
            onError={() => setImgError(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Gradient vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: hasPhoto
            ? 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)',
        }} />

        {/* Photo of the Day badge */}
        {badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(201,162,39,0.92)', backdropFilter: 'blur(4px)',
            color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: FONT_BODY,
            padding: '3px 9px', borderRadius: 20,
            letterSpacing: '0.04em',
          }}>
            {badge}
          </div>
        )}

        {/* Multi-photo count */}
        {overflow > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: FONT_BODY,
            padding: '3px 10px', borderRadius: 20,
          }}>
            +{overflow} photos
          </div>
        )}

        {/* Caption */}
        {caption && hasPhoto && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '20px 12px 10px',
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))',
            color: '#fff', fontSize: 12, fontFamily: FONT_BODY,
            fontWeight: 500, lineHeight: 1.4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {caption}
          </div>
        )}

        {/* Placeholder icon when no photo */}
        {!hasPhoto && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6, opacity: 0.55,
          }}>
            <span style={{ fontSize: 32 }}>📸</span>
            <span style={{ fontSize: 11, color: '#fff', fontFamily: FONT_BODY, fontWeight: 600 }}>No photo</span>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <PhotoLightbox paths={paths} startAt={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
