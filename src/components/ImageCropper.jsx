// ─────────────────────────────────────────────────────────────────────────────
// components/ImageCropper.jsx — Reusable drag-to-crop image modal
//
// Opens after the user picks a file. They drag to reposition and use the zoom
// slider to frame their shot. A canvas export captures only the visible area
// as a JPEG blob — nothing is uploaded until the user confirms.
//
// Props:
//   file      — File object from an <input type="file">
//   aspect    — Crop box aspect ratio (e.g. 1 for square, 840/220 for banner)
//   label     — Human-readable name shown in the header ("cover photo", "avatar")
//   onConfirm — Called with the cropped Blob when the user clicks confirm
//   onCancel  — Called when the user dismisses without confirming
//
// Output resolution:
//   aspect > 1.5  → 840 × (840 / aspect)   — wide banner / cover photos
//   otherwise     → 400 × 400               — square avatars
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { NAVY2, BORDER, WHITE, MUTED, FONT_BODY } from '../constants'

export default function ImageCropper({ file, aspect, label, onConfirm, onCancel }) {
  const [src,       setSrc]    = useState(null)
  const [zoom,      setZoom]   = useState(1)
  const [offset,    setOffset] = useState({ x: 0, y: 0 })
  const [minZoom,   setMinZoom] = useState(1)
  const [ready,     setReady]  = useState(false)
  const [exporting, setExport] = useState(false)

  const boxRef  = useRef(null)
  const imgRef  = useRef(null)
  const dragRef = useRef(null)
  // liveRef holds the latest values without triggering re-renders — used inside
  // event handlers and canvas export where stale closure values would cause bugs
  const liveRef = useRef({ zoom: 1, offset: { x: 0, y: 0 }, natural: { w: 0, h: 0 } })

  // Create a temporary object URL for the picked file and revoke it on cleanup
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Clamp (ox, oy) so the image never exposes the black box background —
  // the image edge must always sit at or beyond the crop box edge.
  const clamp = useCallback((ox, oy, z) => {
    const box = boxRef.current
    if (!box) return { x: ox, y: oy }
    const { w, h } = liveRef.current.natural
    return {
      x: Math.min(0, Math.max(ox, box.clientWidth  - w * z)),
      y: Math.min(0, Math.max(oy, box.clientHeight - h * z)),
    }
  }, [])

  // Once the <img> loads, compute the minimum zoom that fills the crop box
  // and centre the image at that zoom level.
  const onImgLoad = useCallback(() => {
    const img = imgRef.current, box = boxRef.current
    if (!img || !box) return
    const nat = { w: img.naturalWidth, h: img.naturalHeight }
    liveRef.current.natural = nat
    const mz      = Math.max(box.clientWidth / nat.w, box.clientHeight / nat.h)
    const initOff = { x: (box.clientWidth - nat.w * mz) / 2, y: (box.clientHeight - nat.h * mz) / 2 }
    liveRef.current.zoom = mz
    liveRef.current.offset = initOff
    setMinZoom(mz); setZoom(mz); setOffset(initOff); setReady(true)
  }, [])

  // Drag handlers — store the initial pointer + offset on mousedown/touchstart,
  // then update position on move, reset on release.
  const startDrag = useCallback((cx, cy) => {
    dragRef.current = { sx: cx, sy: cy, ox: liveRef.current.offset.x, oy: liveRef.current.offset.y }
  }, [])

  const moveDrag = useCallback((cx, cy) => {
    if (!dragRef.current) return
    const { sx, sy, ox, oy } = dragRef.current
    const clamped = clamp(ox + cx - sx, oy + cy - sy, liveRef.current.zoom)
    liveRef.current.offset = clamped
    setOffset({ ...clamped })
  }, [clamp])

  const endDrag = useCallback(() => { dragRef.current = null }, [])

  // Zoom around the centre of the crop box — keeps the focal point stable
  // while scaling up or down.
  const applyZoom = useCallback((newZ) => {
    const box = boxRef.current; if (!box) return
    const { zoom: oldZ, offset: { x: ox, y: oy } } = liveRef.current
    const cx = box.clientWidth / 2, cy = box.clientHeight / 2
    const imgPx = (cx - ox) / oldZ, imgPy = (cy - oy) / oldZ
    const clamped = clamp(cx - imgPx * newZ, cy - imgPy * newZ, newZ)
    liveRef.current.zoom = newZ
    liveRef.current.offset = clamped
    setZoom(newZ); setOffset(clamped)
  }, [clamp])

  // Draw the visible crop area onto a canvas and return it as a JPEG blob.
  // Output width: 840px for wide images (banners/covers), 400px for squares.
  const handleConfirm = useCallback(() => {
    if (!ready || !src) return
    setExport(true)
    const box = boxRef.current
    const { zoom: z, offset: { x: ox, y: oy } } = liveRef.current
    const boxW = box.clientWidth, boxH = box.clientHeight
    const outW = aspect > 1.5 ? 840 : 400
    const outH = Math.round(outW / aspect)
    const canvas = document.createElement('canvas')
    canvas.width = outW; canvas.height = outH
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, -ox / z, -oy / z, boxW / z, boxH / z, 0, 0, outW, outH)
      canvas.toBlob(blob => { setExport(false); onConfirm(blob) }, 'image/jpeg', 0.92)
    }
    img.src = src
  }, [ready, src, aspect, onConfirm])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseMove={e => moveDrag(e.clientX, e.clientY)}
      onMouseUp={endDrag}
    >
      <div style={{ background: WHITE, borderRadius: 20, overflow: 'hidden', width: '100%', maxWidth: 580, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, color: NAVY2, fontSize: 15, fontFamily: FONT_BODY }}>Position your {label}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2, fontFamily: FONT_BODY }}>Drag to reposition · slider to zoom in</div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: MUTED, padding: 4, lineHeight: 1 }}>×</button>
        </div>

        {/* Crop box */}
        <div
          ref={boxRef}
          style={{ width: '100%', aspectRatio: `${aspect}`, overflow: 'hidden', background: '#111', position: 'relative', cursor: ready ? 'grab' : 'default', userSelect: 'none', touchAction: 'none' }}
          onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
          onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={endDrag}
        >
          {src && (
            <img
              ref={imgRef} src={src} onLoad={onImgLoad} draggable={false} alt=""
              style={{ position: 'absolute', left: offset.x, top: offset.y, width: liveRef.current.natural.w * zoom, height: liveRef.current.natural.h * zoom, display: ready ? 'block' : 'none', pointerEvents: 'none' }}
            />
          )}
          {/* Rule-of-thirds grid overlay */}
          {ready && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: ['linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', 'linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)'].join(','), backgroundSize: '33.33% 33.33%' }} />
          )}
          {!ready && src && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: FONT_BODY }}>Loading…</div>
          )}
        </div>

        {/* Zoom slider */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 15 }}>🔍</span>
          <input
            type="range"
            min={minZoom} max={minZoom * 3} step={minZoom * 0.005}
            value={zoom} disabled={!ready}
            onChange={e => applyZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--t-primary)' }}
          />
          <span style={{ fontSize: 12, color: MUTED, minWidth: 38, textAlign: 'right', fontWeight: 600, fontFamily: FONT_BODY }}>
            {ready ? `${Math.round((zoom / minZoom) * 100)}%` : '—'}
          </span>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: FONT_BODY }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!ready || exporting}
            style={{ background: 'var(--t-primary)', color: WHITE, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, fontFamily: FONT_BODY, cursor: (!ready || exporting) ? 'default' : 'pointer', opacity: (!ready || exporting) ? 0.6 : 1 }}
          >
            {exporting ? 'Processing…' : `Use this ${label}`}
          </button>
        </div>
      </div>
    </div>
  )
}
