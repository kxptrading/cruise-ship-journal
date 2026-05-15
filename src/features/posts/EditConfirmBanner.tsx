// ─────────────────────────────────────────────────────────────────────────────
// features/posts/EditConfirmBanner.tsx — Spec §6 edit-guardrail banner
//
// Shown on PostEditorPage when post.audience !== 'private'.
// Dismissed per-edit-session only (not persisted).
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { FONT_BODY } from '@/constants'
import AudienceSelector from './AudienceSelector'
import type { Audience } from '@/types/models'
import { useState } from 'react'

interface Props {
  audience:        Audience
  onDismiss:       () => void
  onChangeAudience:(a: Audience) => void
}

const LABEL: Record<string, string> = { family: 'Family', public: 'everyone' }

export default function EditConfirmBanner({ audience, onDismiss, onChangeAudience }: Props) {
  const [showSelector, setShowSelector] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        background:   '#FFFBEB',
        border:       '1px solid #FCD34D',
        borderRadius: 14,
        padding:      '14px 16px',
        marginBottom: 20,
        fontFamily:   FONT_BODY,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>ⓘ</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: '#92400E', fontWeight: 600, marginBottom: 4 }}>
            This post is currently visible to {LABEL[audience] ?? audience}.
          </div>
          <div style={{ fontSize: 13, color: '#B45309', marginBottom: 10 }}>
            Your edit will be visible immediately.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowSelector(s => !s)}
              style={{ background: 'none', border: '1px solid #F59E0B', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#B45309', fontWeight: 600 }}
            >
              Change audience ▾
            </button>
            <button
              onClick={onDismiss}
              style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#92400E', fontWeight: 600 }}
            >
              Got it
            </button>
          </div>

          {showSelector && (
            <div style={{ marginTop: 12 }}>
              <AudienceSelector value={audience} onChange={a => { onChangeAudience(a); setShowSelector(false) }} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
