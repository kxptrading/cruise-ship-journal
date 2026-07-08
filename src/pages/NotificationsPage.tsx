// ─────────────────────────────────────────────────────────────────────────────
// pages/NotificationsPage.tsx — full-page notifications list (/notifications)
//
// The mobile top bar collapses search + notifications into the profile menu, so
// notifications need a real destination. This full-page list reuses the bell's
// hooks and row helpers, marks everything read on mount, and routes each row to
// the relevant post/voyage. On desktop the bell popover still exists; this page
// is reachable directly and from the mobile menu.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { WHITE, BORDER, NAVY2, MUTED, TEXT, FONT_BODY, FONT_DISPLAY } from '@/constants'
import {
  useNotifications, useUnreadNotificationCount, useMarkNotificationsRead,
} from '@/features/notifications/hooks'
import { relativeTime, VERB, TypeIcon, targetPath } from '@/features/notifications/NotificationsBell'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const unread   = useUnreadNotificationCount()
  const markRead = useMarkNotificationsRead()

  // Landing on the page clears the unread badge.
  useEffect(() => {
    if (unread > 0) markRead.mutate(undefined)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      <h1 style={{ margin: '0 0 18px', fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, color: NAVY2 }}>
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '48px 20px', textAlign: 'center', color: MUTED, fontSize: 14 }}>
          You're all caught up.
        </div>
      ) : (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => navigate(targetPath(n))}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                padding: '14px 16px', border: 'none', borderBottom: `1px solid ${BORDER}`,
                background: n.readAt ? WHITE : 'rgba(201,162,39,0.07)', cursor: 'pointer', fontFamily: FONT_BODY,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F4F3EF' }}
              onMouseLeave={e => { e.currentTarget.style.background = n.readAt ? WHITE : 'rgba(201,162,39,0.07)' }}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: '#F4F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <TypeIcon type={n.type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: NAVY2 }}>{n.actorName}</span> {VERB[n.type]}
                </div>
                {n.preview && (
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.preview}
                  </div>
                )}
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{relativeTime(n.createdAt)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
