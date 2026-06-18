// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/CoAuthorsPanel.tsx — Owner's "manage co-authors" modal
//
// Lets the voyage owner invite other users (search by name/email, reusing
// useSearchUsers) and see / remove existing co-authors. Co-authors are additive
// contributors: once accepted they can add photos and posts to the voyage.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, UserPlus, Check, Clock } from 'lucide-react'
import { WHITE, BORDER, NAVY2, MUTED, TEXT, GOLD, FONT_DISPLAY, FONT_BODY } from '@/constants'
import { useSearchUsers } from '@/features/contacts/hooks'
import { useVoyageMembers, useInviteCoAuthor, useRemoveCoAuthor } from './coauthors'

interface Props {
  voyageId: string
  onClose:  () => void
}

export default function CoAuthorsPanel({ voyageId, onClose }: Props) {
  const [query, setQuery] = useState('')
  const { data: members = [] } = useVoyageMembers(voyageId)
  const { data: results = [] } = useSearchUsers(query)
  const invite = useInviteCoAuthor()
  const remove = useRemoveCoAuthor()

  // Don't offer to invite someone who's already a member (pending or accepted).
  const memberIds = new Set(members.map(m => m.userId))

  const handleInvite = async (inviteeId: string) => {
    await invite.mutateAsync({ voyageId, inviteeId })
    setQuery('')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 340 }}
          onClick={e => e.stopPropagation()}
          style={{ background: WHITE, borderRadius: 20, padding: 24, maxWidth: 460, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
              Co-authors
            </h2>
            <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: MUTED, fontFamily: FONT_BODY, lineHeight: 1.5 }}>
            Co-authors can add their own photos and posts to this voyage. They can't
            edit your journal sections or delete the voyage.
          </p>

          {/* Invite search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Invite by name or email…"
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px 10px 34px', fontSize: 14, fontFamily: FONT_BODY, color: TEXT, outline: 'none' }}
            />
          </div>

          {/* Search results */}
          {query.trim().length >= 2 && (
            <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.length === 0 && (
                <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY, padding: '4px 2px' }}>No users found.</div>
              )}
              {results.map(r => {
                const already = memberIds.has(r.userId)
                return (
                  <div key={r.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
                    <Avatar url={r.avatarUrl} name={r.displayName || r.email || '?'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: TEXT, fontFamily: FONT_BODY, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.displayName || 'Unnamed'}
                      </div>
                      {r.email && <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email}</div>}
                    </div>
                    <button
                      onClick={() => handleInvite(r.userId)}
                      disabled={already || invite.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: already ? 'none' : NAVY2, color: already ? MUTED : WHITE, border: already ? `1px solid ${BORDER}` : 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, fontFamily: FONT_BODY, cursor: already ? 'default' : 'pointer' }}
                    >
                      {already ? 'Added' : <><UserPlus size={13} /> Invite</>}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Current members */}
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_BODY, marginBottom: 10 }}>
            On this voyage
          </div>
          {members.length === 0 ? (
            <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
              No co-authors yet. Invite someone above to share the journal.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar url={m.avatarUrl} name={m.displayName} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: TEXT, fontFamily: FONT_BODY, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.displayName}
                    </div>
                    <div style={{ fontSize: 12, color: m.status === 'accepted' ? GOLD : MUTED, fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {m.status === 'accepted' ? <><Check size={12} /> Co-author</> : <><Clock size={12} /> Invited</>}
                    </div>
                  </div>
                  <button
                    onClick={() => remove.mutate({ memberId: m.id, voyageId })}
                    style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 10px', fontSize: 12, color: MUTED, fontFamily: FONT_BODY, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: 14, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>{name.charAt(0).toUpperCase()}</span>}
    </div>
  )
}
