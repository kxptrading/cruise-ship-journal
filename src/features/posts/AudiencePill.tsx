// ─────────────────────────────────────────────────────────────────────────────
// features/posts/AudiencePill.tsx — Read-only audience chip
// ─────────────────────────────────────────────────────────────────────────────

import { FONT_BODY } from '@/constants'
import type { Audience } from '@/types/models'

interface Props {
  audience: Audience
  size?:    'sm' | 'md'
}

const CONFIG: Record<Audience, { label: string; emoji: string; bg: string; color: string; border: string }> = {
  private: { label: 'Private', emoji: '🔒', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  family:  { label: 'Family',  emoji: '👨‍👩‍👧', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  public:  { label: 'Public',  emoji: '🌐', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
}

export default function AudiencePill({ audience, size = 'sm' }: Props) {
  const { label, emoji, bg, color, border } = CONFIG[audience]
  const pad = size === 'md' ? '4px 12px' : '2px 8px'
  const fontSize = size === 'md' ? 12 : 11

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          4,
      background:   bg,
      color,
      border:       `1px solid ${border}`,
      borderRadius: 20,
      padding:      pad,
      fontSize,
      fontWeight:   600,
      fontFamily:   FONT_BODY,
      whiteSpace:   'nowrap',
    }}>
      <span style={{ fontSize: size === 'md' ? 13 : 12, lineHeight: 1 }}>{emoji}</span>
      {label}
    </span>
  )
}
