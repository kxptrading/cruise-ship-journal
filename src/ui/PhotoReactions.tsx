// ui/PhotoReactions.tsx — Emoji reaction bar for a single photo

import { motion } from 'framer-motion'
import { GOLD, FONT_BODY } from '@/constants'
import { usePhotoReactions } from '@/features/posts/usePhotoReactions'
import { useUserId } from '@/context'

interface Props {
  photoPath: string
  postId:    string
  /** 'dark' for use inside lightboxes, 'light' for use on white card backgrounds */
  variant?:  'dark' | 'light'
}

export default function PhotoReactions({ photoPath, postId, variant = 'dark' }: Props) {
  const userId = useUserId()
  const { reactions, toggle, isPending } = usePhotoReactions(photoPath)

  if (!userId) return null

  const isDark = variant === 'dark'

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {reactions.map(r => {
        const active = r.userReacted
        return (
          <motion.button
            key={r.emoji}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => toggle({ emoji: r.emoji, postId })}
            disabled={isPending}
            title={r.label}
            style={{
              background:  active
                ? `${GOLD}30`
                : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border:      `1px solid ${active ? GOLD : isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 20,
              padding:     r.count > 0 ? '5px 10px' : '5px 8px',
              cursor:      'pointer',
              display:     'flex',
              alignItems:  'center',
              gap:         4,
              fontSize:    16,
              lineHeight:  1,
              fontFamily:  FONT_BODY,
              transition:  'background 0.15s, border-color 0.15s',
              opacity:     isPending ? 0.6 : 1,
            }}
          >
            <span>{r.emoji}</span>
            {r.count > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: active ? GOLD : isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)' }}>
                {r.count}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
