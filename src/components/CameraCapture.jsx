// ─────────────────────────────────────────────────────────────────────────────
// components/CameraCapture.jsx — In-browser camera capture modal
//
// Uses getUserMedia() to open the device camera in a modal video stream.
// Clicking "Capture" freezes the frame onto a canvas and returns a File object.
// Falls back gracefully if the browser or device has no camera.
//
// Props:
//   onCapture(file) — called with a File (image/jpeg) when the user captures
//   onCancel()      — called when the user dismisses without capturing
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { NAVY2, BORDER, WHITE, MUTED, FONT_BODY } from '../constants'

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const [ready,    setReady]    = useState(false)
  const [error,    setError]    = useState('')
  const [facing,   setFacing]   = useState('environment') // 'environment' | 'user'
  const [capturing, setCapturing] = useState(false)

  const startStream = async (facingMode) => {
    // Stop any existing stream first
    streamRef.current?.getTracks().forEach(t => t.stop())
    setReady(false)
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not access camera. Try uploading an image instead.'
      )
    }
  }

  // Start camera on mount
  useEffect(() => {
    startStream(facing)
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = () => {
    const next = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    startStream(next)
  }

  const handleCapture = () => {
    if (!videoRef.current || !ready) return
    setCapturing(true)
    const video  = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) { setCapturing(false); return }
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      // Stop the stream before handing back
      streamRef.current?.getTracks().forEach(t => t.stop())
      onCapture(file)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: WHITE, borderRadius: 20, overflow: 'hidden',
        width: '100%', maxWidth: 560, boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 700, color: NAVY2, fontSize: 15, fontFamily: FONT_BODY }}>
            Take a Photo
          </div>
          <button
            onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onCancel() }}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: MUTED, padding: 4, lineHeight: 1 }}
          >×</button>
        </div>

        {/* Viewfinder */}
        <div style={{ position: 'relative', background: '#111', aspectRatio: '4/3', width: '100%' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              opacity: ready ? 1 : 0, transition: 'opacity 0.3s',
            }}
          />

          {/* Loading / error state */}
          {!ready && !error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: FONT_BODY,
            }}>
              Starting camera…
            </div>
          )}
          {error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12,
            }}>
              <span style={{ fontSize: 36 }}>📷</span>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', fontFamily: FONT_BODY, margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          {/* Flip camera button */}
          {ready && (
            <button
              onClick={handleFlip}
              title="Flip camera"
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                color: WHITE, fontSize: 18, lineHeight: 1,
              }}
            >🔄</button>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 18px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onCancel() }}
            style={{
              background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED,
              borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: FONT_BODY,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            disabled={!ready || capturing}
            style={{
              background: 'var(--t-primary)', color: WHITE, border: 'none',
              borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600,
              fontFamily: FONT_BODY, cursor: (!ready || capturing) ? 'default' : 'pointer',
              opacity: (!ready || capturing) ? 0.6 : 1,
            }}
          >
            {capturing ? 'Capturing…' : '📸 Capture'}
          </button>
        </div>
      </div>
    </div>
  )
}
