// ─────────────────────────────────────────────────────────────────────────────
// features/posts/AudienceSelector.tsx — Segmented audience control
//
// Usage:
//   <AudienceSelector value={audience} onChange={setAudience} />
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { BORDER, FONT_BODY } from '@/constants'
import type { Audience } from '@/types/models'

interface Option {
  value:   Audience
  label:   string
  emoji:   string
  activeColor: string
  activeBg:    string
}

const OPTIONS: Option[] = [
  { value: 'private', label: 'Private', emoji: '🔒', activeColor: '#6B7280', activeBg: '#F3F4F6' },
  { value: 'family',  label: 'Family',  emoji: '👨‍👩‍👧', activeColor: '#2563EB', activeBg: '#EFF6FF' },
  { value: 'public',  label: 'Public',  emoji: '🌐', activeColor: '#16A34A', activeBg: '#F0FDF4' },
]

interface Props {
  value:    Audience
  onChange: (a: Audience) => void
}

export default function AudienceSelector({ value, onChange }: Props) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT_BODY }}>
        Who can see this?
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {OPTIONS.map(opt => {
          const active = value === opt.value
          return (
            <motion.button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.96 }}
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         6,
                padding:     '8px 16px',
                borderRadius: 22,
                border:      `1.5px solid ${active ? opt.activeColor + '80' : BORDER}`,
                background:  active ? opt.activeBg : '#FFFFFF',
                color:       active ? opt.activeColor : '#6B7280',
                cursor:      'pointer',
                fontFamily:  FONT_BODY,
                fontSize:    13,
                fontWeight:  active ? 700 : 400,
                transition:  'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{opt.emoji}</span>
              {opt.label}
            </motion.button>
          )
        })}
      </div>
      <div style={{ marginTop: 7, fontSize: 12, color: '#9CA3AF', fontFamily: FONT_BODY }}>
        {value === 'private' && 'Only you can see this post.'}
        {value === 'family'  && 'Visible to contacts you\'ve marked as Family.'}
        {value === 'public'  && 'Visible to all your contacts.'}
      </div>
    </div>
  )
}
