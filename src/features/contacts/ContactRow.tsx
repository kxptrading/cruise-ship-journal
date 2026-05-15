// ─────────────────────────────────────────────────────────────────────────────
// features/contacts/ContactRow.tsx — Single contact with family toggle
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, FONT_BODY } from '@/constants'
import FamilyToggle from './FamilyToggle'
import { useDeclineRequest } from './hooks'
import type { ContactRow as ContactRowData } from './hooks'
import { X } from 'lucide-react'

interface Props {
  contact:  ContactRowData
  showRemove?: boolean
}

function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'var(--t-primary-dk)', border: `2px solid ${BORDER}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.34, fontWeight: 700, color: '#fff', fontFamily: FONT_BODY }}>{initials}</span>
      }
    </div>
  )
}

export default function ContactRow({ contact, showRemove = false }: Props) {
  const decline = useDeclineRequest()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
    >
      <Avatar url={contact.avatarUrl} name={contact.displayName} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {contact.displayName}
        </div>
        {contact.email && (
          <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {contact.email}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <FamilyToggle requestId={contact.requestId} isFamily={contact.isFamily} />
        {showRemove && (
          <button
            onClick={() => decline.mutate(contact.requestId)}
            disabled={decline.isPending}
            title="Remove contact"
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
