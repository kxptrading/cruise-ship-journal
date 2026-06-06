// ─────────────────────────────────────────────────────────────────────────────
// components/SyncStatusPill.tsx
//
// A small persistent status pill that surfaces sync state to the user.
// Sits in the bottom-right corner on desktop; above the BottomNav on mobile.
//
// States:
//   online  — "Everything synced"   (teal, auto-hides after 4 s)
//   offline — "Saving to device"    (amber, always visible)
//   syncing — "Uploading memories"  (blue, always visible)
//   failed  — "Sync failed · Retry" (red, always visible + retry button)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Check } from 'lucide-react'
import { FONT_BODY } from '../constants'
import type { SyncStatus } from '../hooks/useSyncStatus'

interface Props {
  syncStatus: SyncStatus
  onSync:     () => void
  onRetry:    () => void
  isMobile:   boolean
}

const PILL_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  online:  { bg: 'rgba(13,107,85,0.92)',  border: 'rgba(13,107,85,0.4)',  text: '#fff' },
  offline: { bg: 'rgba(160,100,0,0.92)',  border: 'rgba(160,100,0,0.4)',  text: '#fff' },
  syncing: { bg: 'rgba(20,41,63,0.92)',   border: 'rgba(255,255,255,0.2)', text: '#fff' },
  failed:  { bg: 'rgba(176,48,96,0.92)',  border: 'rgba(176,48,96,0.4)',  text: '#fff' },
}

const LABELS: Record<string, string> = {
  online:  'Everything synced',
  offline: 'Saving to this device',
  syncing: 'Uploading your memories…',
  failed:  'Sync failed',
}

export default function SyncStatusPill({ syncStatus, onSync, onRetry, isMobile }: Props) {
  const { state } = syncStatus
  const [visible, setVisible] = useState(true)

  // Auto-hide the "synced" confirmation after 4 seconds.
  useEffect(() => {
    if (state === 'online') {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 4_000)
      return () => clearTimeout(t)
    }
    setVisible(true)
  }, [state])

  if (!visible) return null

  const colours = PILL_STYLES[state]
  const label   = LABELS[state]

  const Icon = state === 'online'  ? Check
             : state === 'offline' ? WifiOff
             : state === 'syncing' ? RefreshCw
             : AlertTriangle

  // Mobile: position above bottom nav (54px) with some breathing room
  // Desktop: fixed bottom-right corner
  const position = isMobile
    ? { bottom: 64, left: '50%', transform: 'translateX(-50%)' }
    : { bottom: 24, right: 24 }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:     'fixed',
        zIndex:       600,
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        padding:      '7px 14px',
        borderRadius: 999,
        background:   colours.bg,
        border:       `1px solid ${colours.border}`,
        boxShadow:    '0 2px 12px rgba(0,0,0,0.25)',
        fontFamily:   FONT_BODY,
        fontSize:     13,
        fontWeight:   600,
        color:        colours.text,
        whiteSpace:   'nowrap',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition:   'opacity 0.3s ease',
        ...position,
      }}
    >
      <Icon
        size={14}
        strokeWidth={2.5}
        style={{
          flexShrink: 0,
          animation: state === 'syncing' ? 'spin 1.2s linear infinite' : undefined,
        }}
      />
      {label}

      {state === 'failed' && (
        <button
          onClick={onRetry}
          style={{
            marginLeft:   4,
            background:   'rgba(255,255,255,0.2)',
            border:       '1px solid rgba(255,255,255,0.3)',
            borderRadius: 6,
            padding:      '2px 8px',
            fontFamily:   FONT_BODY,
            fontSize:     11,
            fontWeight:   700,
            color:        '#fff',
            cursor:       'pointer',
          }}
        >
          Retry
        </button>
      )}

      {state === 'offline' && syncStatus.pending > 0 && (
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {syncStatus.pending} queued
        </span>
      )}

      {state === 'online' && (
        <button
          onClick={onSync}
          aria-label="Sync now"
          style={{
            marginLeft:   4,
            background:   'transparent',
            border:       'none',
            padding:      '2px 4px',
            cursor:       'pointer',
            color:        'rgba(255,255,255,0.7)',
            display:      'flex',
            alignItems:   'center',
          }}
          title="Sync now"
        >
          <Wifi size={12} strokeWidth={2} />
        </button>
      )}

      {/* CSS spin animation injected once */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
