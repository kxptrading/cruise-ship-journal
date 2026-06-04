// ─────────────────────────────────────────────────────────────────────────────
// features/contacts/FamilyToggle.tsx — Single boolean family tag
//
// A contact is either Family or not — no multi-group system (spec §3).
// Toggling invalidates ['feed'] via useToggleFamily so the Feed immediately
// reflects the change (family posts appear/disappear without page reload).
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { FONT_BODY } from '@/constants'
import { useToggleFamily } from './hooks'

interface Props {
  requestId: string
  isFamily:  boolean
}

export default function FamilyToggle({ requestId, isFamily }: Props) {
  const toggle = useToggleFamily()

  const handleClick = () => {
    toggle.mutate({ requestId, isFamily: !isFamily })
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={toggle.isPending}
      whileTap={{ scale: 0.94 }}
      title={isFamily ? 'Family contact — click to remove tag' : 'Mark as Family to share family posts'}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         6,
        padding:     '5px 12px',
        borderRadius: 20,
        border:      `1.5px solid ${isFamily ? '#BFDBFE' : '#E5E7EB'}`,
        background:  isFamily ? '#EFF6FF' : '#F9FAFB',
        color:       isFamily ? '#2563EB' : '#9CA3AF',
        cursor:      toggle.isPending ? 'wait' : 'pointer',
        fontSize:    12,
        fontWeight:  isFamily ? 700 : 400,
        fontFamily:  FONT_BODY,
        transition:  'all 0.15s',
        opacity:     toggle.isPending ? 0.6 : 1,
        whiteSpace:  'nowrap',
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>👨‍👩‍👧</span>
      {isFamily ? 'Family' : 'Add to Family'}
    </motion.button>
  )
}
