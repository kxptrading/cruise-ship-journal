// components/OfflineBanner.tsx
//
// A dismissible banner shown when the device has no network connection.
// Uses friendly, non-technical language as required.

import { useState } from 'react'
import { WifiOff, X } from 'lucide-react'
import { FONT_BODY } from '../constants'

interface Props {
  visible: boolean
}

export default function OfflineBanner({ visible }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (!visible || dismissed) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position:     'relative',
        background:   'rgba(160,100,0,0.96)',
        color:        '#fff',
        padding:      '10px 16px',
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        fontFamily:   FONT_BODY,
        fontSize:     13,
        zIndex:       300,
        flexShrink:   0,
      }}
    >
      <WifiOff size={16} strokeWidth={2} style={{ flexShrink: 0 }} />

      <span style={{ flex: 1, lineHeight: 1.4 }}>
        <strong>You're offline.</strong>{' '}
        Your journal is being saved on this device and will sync when you reconnect.
      </span>

      <button
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        style={{
          background:  'transparent',
          border:      'none',
          padding:     4,
          cursor:      'pointer',
          color:       'rgba(255,255,255,0.8)',
          display:     'flex',
          alignItems:  'center',
          flexShrink:  0,
        }}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
