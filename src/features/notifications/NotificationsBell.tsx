// ─────────────────────────────────────────────────────────────────────────────
// features/notifications/NotificationsBell.tsx — bell + dropdown for TopNav
//
// Shows an unread count badge; opening the panel lists recent notifications and
// marks them read. Each row links to the relevant post/voyage.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AtSign, Heart, MessageCircle } from 'lucide-react'
import { WHITE, BORDER, NAVY2, MUTED, TEXT, GOLD, FONT_BODY } from '@/constants'
import { useIconPack } from '@/context'
import FE from '@/components/FE'
import { useNotifications, useUnreadNotificationCount, useMarkNotificationsRead, type AppNotification } from './hooks'

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h`
  if (d < 7)  return `${d}d`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const VERB: Record<AppNotification['type'], string> = {
  mention:  'mentioned you',
  reaction: 'reacted to your post',
  comment:  'commented on your post',
}

export function TypeIcon({ type }: { type: AppNotification['type'] }) {
  const common = { size: 13, strokeWidth: 2.5 }
  if (type === 'mention')  return <AtSign {...common} color={GOLD} />
  if (type === 'reaction') return <Heart {...common} color="#B03060" />
  return <MessageCircle {...common} color="#0D6B55" />
}

export function targetPath(n: AppNotification): string {
  if (n.postId && n.voyageId) return `/voyages/${n.voyageId}/posts/${n.postId}`
  if (n.voyageId) return `/voyages/${n.voyageId}`
  return '/feed'
}

interface Props { size?: number; color?: string }

export default function NotificationsBell({ size = 22, color = 'rgba(255,255,255,0.85)' }: Props) {
  const navigate = useNavigate()
  const iconPack = useIconPack()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { data: notifications = [] } = useNotifications()
  const unread = useUnreadNotificationCount()
  const markRead = useMarkNotificationsRead()

  // Opening the panel clears the unread badge.
  useEffect(() => {
    if (open && unread > 0) markRead.mutate(undefined)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const openRow = (n: AppNotification) => {
    setOpen(false)
    navigate(targetPath(n))
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'rgba(201,162,39,0.18)' : 'transparent', border: 'none',
          width: size + 18, height: size + 18, flexShrink: 0, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: open ? GOLD : color, borderRadius: 8,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {iconPack !== 'lucide'
          ? <FE emoji="🔔" size={size} />
          : <Bell size={size} strokeWidth={1.9} />}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 999, background: '#E5484D', color: WHITE, fontSize: 10, fontWeight: 800,
            fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px var(--t-primary-dk)',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 300 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 301,
            width: 340, maxWidth: '90vw', maxHeight: 440, overflowY: 'auto',
            background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: NAVY2 }}>
              Notifications
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: MUTED, fontSize: 13, fontFamily: FONT_BODY }}>
                You're all caught up.
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => openRow(n)}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                    padding: '11px 15px', border: 'none', borderBottom: `1px solid ${BORDER}`,
                    background: n.readAt ? WHITE : 'rgba(201,162,39,0.07)', cursor: 'pointer', fontFamily: FONT_BODY,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F4F3EF' }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.readAt ? WHITE : 'rgba(201,162,39,0.07)' }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: '#F4F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <TypeIcon type={n.type} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 700, color: NAVY2 }}>{n.actorName}</span> {VERB[n.type]}
                    </div>
                    {n.preview && (
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.preview}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{relativeTime(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
