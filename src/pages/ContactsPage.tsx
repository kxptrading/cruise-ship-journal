// ─────────────────────────────────────────────────────────────────────────────
// pages/ContactsPage.tsx — Contacts with Family tag (spec §4: /contacts)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, TEAL, GOLD, FONT_DISPLAY, FONT_BODY, BP, sty } from '@/constants'
import { useW, useUserId } from '@/context'
import {
  useContacts, useSendFriendRequest, useAcceptRequest, useDeclineRequest, useSearchUsers,
} from '@/features/contacts/hooks'
import ContactRow from '@/features/contacts/ContactRow'
import FriendProfile from '@/features/contacts/FriendProfile'
import type { ContactRow as ContactRowData } from '@/features/contacts/hooks'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { STAGGER, FADE_UP } from '@/lib/motion'
import { Search, UserPlus, Check, X } from 'lucide-react'

function Avatar({ url, name, size = 38 }: { url: string | null; name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'var(--t-primary-dk)', border: `2px solid ${BORDER}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.34, fontWeight: 700, color: '#fff', fontFamily: FONT_BODY }}>{initials}</span>
      }
    </div>
  )
}

export default function ContactsPage() {
  const w      = useW()
  const userId = useUserId()
  const [searchQuery,    setSearchQuery]    = useState('')
  const [debouncedQ,     setDebouncedQ]     = useState('')
  const [selectedFriend, setSelectedFriend] = useState<ContactRowData | null>(null)

  const { data: contacts, isLoading } = useContacts()
  const { data: searchResults = [] }  = useSearchUsers(debouncedQ)
  const sendRequest  = useSendFriendRequest()
  const acceptReq    = useAcceptRequest()
  const declineReq   = useDeclineRequest()

  const handleSearchChange = (v: string) => {
    setSearchQuery(v)
    clearTimeout((window as Window & { _sqt?: number })._sqt)
    ;(window as Window & { _sqt?: number })._sqt = window.setTimeout(() => setDebouncedQ(v), 300)
  }

  const alreadyConnected = new Set([
    ...(contacts?.accepted ?? []).map(c => c.userId),
    ...(contacts?.incoming ?? []).map(c => c.userId),
    ...(contacts?.outgoing ?? []).map(c => c.userId),
  ])

  const familyCount = (contacts?.accepted ?? []).filter(c => c.isFamily).length

  if (selectedFriend) {
    return (
      <FriendProfile
        friend={{ userId: selectedFriend.userId, displayName: selectedFriend.displayName, avatarUrl: selectedFriend.avatarUrl }}
        onBack={() => setSelectedFriend(null)}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: w < BP.mobile ? 24 : 30, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
          Contacts
        </h1>
        {!isLoading && contacts && (
          <p style={{ margin: 0, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
            {contacts.accepted.length} contact{contacts.accepted.length !== 1 ? 's' : ''}
            {familyCount > 0 && ` · ${familyCount} family`}
          </p>
        )}
      </div>

      {/* Search to add contacts */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: FONT_BODY }}>
          Find people
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
            <input
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by name or email…"
              style={{ ...sty.inp, paddingLeft: 34 }}
            />
          </div>
        </div>

        {/* Search results */}
        <AnimatePresence>
          {debouncedQ.length >= 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: 10 }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '12px 4px', fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>No users found for "{debouncedQ}"</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {searchResults.map(r => {
                    const connected = alreadyConnected.has(r.userId)
                    const isOutgoing = (contacts?.outgoing ?? []).some(c => c.userId === r.userId)
                    return (
                      <div key={r.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
                        <Avatar url={r.avatarUrl} name={r.displayName ?? r.email ?? '?'} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY2, fontFamily: FONT_BODY }}>{r.displayName ?? 'User'}</div>
                          {r.email && <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>{r.email}</div>}
                        </div>
                        {connected ? (
                          <span style={{ fontSize: 12, color: isOutgoing ? GOLD : TEAL, fontWeight: 600, fontFamily: FONT_BODY }}>
                            {isOutgoing ? 'Requested' : 'Connected'}
                          </span>
                        ) : (
                          <motion.button
                            onClick={() => sendRequest.mutate(r.userId)}
                            disabled={sendRequest.isPending}
                            whileTap={{ scale: 0.96 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--t-primary)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT_BODY }}
                          >
                            <UserPlus size={13} /> Add
                          </motion.button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Incoming requests */}
      {(contacts?.incoming ?? []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: FONT_BODY }}>
            Pending requests ({contacts!.incoming.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contacts!.incoming.map(c => (
              <div key={c.requestId} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Avatar url={c.avatarUrl} name={c.displayName} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{c.displayName}</div>
                  {c.email && <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>{c.email}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    onClick={() => acceptReq.mutate(c.requestId)}
                    whileTap={{ scale: 0.94 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#16A34A', fontFamily: FONT_BODY }}
                  >
                    <Check size={13} /> Accept
                  </motion.button>
                  <motion.button
                    onClick={() => declineReq.mutate(c.requestId)}
                    whileTap={{ scale: 0.94 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, cursor: 'pointer', fontSize: 12, color: '#DC2626', fontFamily: FONT_BODY }}
                  >
                    <X size={13} />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_BODY }}>
            My Contacts
          </div>
          {familyCount > 0 && (
            <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, fontFamily: FONT_BODY, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '2px 10px' }}>
              👨‍👩‍👧 {familyCount} family
            </span>
          )}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!isLoading && (contacts?.accepted ?? []).length === 0 && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16 }}>
            <EmptyState
              icon="👥"
              heading="No contacts yet"
              body="Search for people above to connect with them. Once connected, you can mark them as Family to share family-only posts."
            />
          </div>
        )}

        {!isLoading && (contacts?.accepted ?? []).length > 0 && (
          <motion.div variants={STAGGER} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Family contacts first */}
            {contacts!.accepted
              .slice()
              .sort((a, b) => (b.isFamily ? 1 : 0) - (a.isFamily ? 1 : 0))
              .map(c => (
                <motion.div key={c.requestId} variants={FADE_UP}>
                  <ContactRow contact={c} showRemove onViewProfile={() => setSelectedFriend(c)} />
                </motion.div>
              ))
            }
          </motion.div>
        )}

        {/* Family tip */}
        {!isLoading && (contacts?.accepted ?? []).length > 0 && familyCount === 0 && (
          <div style={{ marginTop: 14, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#92400E', fontFamily: FONT_BODY }}>
            💡 Mark contacts as <strong>Family</strong> to share family-only posts with them — or to see their family posts in your Feed.
          </div>
        )}
      </div>
    </div>
  )
}
