// ─────────────────────────────────────────────────────────────────────────────
// sections/UserProfile.jsx — Personal cruiser profile
//
// Facebook-style layout:
//   • Full-width banner photo (clickable to upload)
//   • Circular avatar overlapping the bottom of the banner
//   • Display name, bio, and personal details (editable in-place)
//   • Fun at-a-glance cruise stats derived from all voyages
//
// Photo uploads go through ImageCropper — user drags/zooms to frame the shot
// before the canvas-rendered crop is sent to Supabase Storage.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUserId, useW } from '../context'
import { NAVY, NAVY2, GOLD, CREAM, WHITE, BORDER, TEXT, MUTED, LIGHT, TEAL, BP } from '../constants'
import { sty } from '../constants'

// ── Layout constants ──────────────────────────────────────────────────────────
const BANNER_H        = 220
const AVATAR_SIZE     = 96
const AVATAR_BORDER   = 4
const AVATAR_OVERLAP  = AVATAR_SIZE / 2 + AVATAR_BORDER
const BANNER_ASPECT   = 840 / BANNER_H   // ≈ 3.82

// ── Image Cropper Modal ───────────────────────────────────────────────────────
// Opens after the user picks a file. They drag to reposition and use the zoom
// slider to frame their shot. "Use this photo" renders the visible area onto a
// canvas and emits a JPEG blob — no file is uploaded until they confirm.
//
// aspect  — width/height ratio for the preview box (1 for avatar, ~3.82 for banner)
// label   — shown in the button: "photo" | "banner"
// onConfirm(blob) — called with the cropped JPEG blob
function ImageCropper({ file, aspect, label, onConfirm, onCancel }) {
  const [src,       setSrc]    = useState(null)
  const [zoom,      setZoom]   = useState(1)
  const [offset,    setOffset] = useState({ x: 0, y: 0 })
  const [minZoom,   setMinZoom] = useState(1)
  const [ready,     setReady]  = useState(false)
  const [exporting, setExport] = useState(false)

  const boxRef  = useRef(null)
  const imgRef  = useRef(null)
  const dragRef = useRef(null)   // { sx, sy, ox, oy } — values at drag-start
  // liveRef mirrors zoom/offset/natural synchronously so event handlers never
  // read stale closure values between React render cycles.
  const liveRef = useRef({ zoom: 1, offset: { x: 0, y: 0 }, natural: { w: 0, h: 0 } })

  // Load the selected file as an object URL
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Clamp offset so the image always fills the preview box (no empty edges)
  const clamp = useCallback((ox, oy, z) => {
    const box = boxRef.current
    if (!box) return { x: ox, y: oy }
    const { w, h } = liveRef.current.natural
    return {
      x: Math.min(0, Math.max(ox, box.clientWidth  - w * z)),
      y: Math.min(0, Math.max(oy, box.clientHeight - h * z)),
    }
  }, [])

  // Once the <img> has loaded, calculate the fill zoom and centre the image
  const onImgLoad = useCallback(() => {
    const img = imgRef.current
    const box = boxRef.current
    if (!img || !box) return
    const nat = { w: img.naturalWidth, h: img.naturalHeight }
    liveRef.current.natural = nat
    const mz = Math.max(box.clientWidth / nat.w, box.clientHeight / nat.h)
    const initOff = {
      x: (box.clientWidth  - nat.w * mz) / 2,
      y: (box.clientHeight - nat.h * mz) / 2,
    }
    liveRef.current.zoom   = mz
    liveRef.current.offset = initOff
    setMinZoom(mz)
    setZoom(mz)
    setOffset(initOff)
    setReady(true)
  }, [])

  // ── Drag ─────────────────────────────────────────────────────────────────
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

  // ── Zoom — zooms around the centre of the preview box ────────────────────
  const applyZoom = useCallback((newZ) => {
    const box = boxRef.current
    if (!box) return
    const { zoom: oldZ, offset: { x: ox, y: oy } } = liveRef.current
    const cx = box.clientWidth / 2, cy = box.clientHeight / 2
    // Keep the image point that's currently at box-centre pinned there
    const imgPx = (cx - ox) / oldZ, imgPy = (cy - oy) / oldZ
    const clamped = clamp(cx - imgPx * newZ, cy - imgPy * newZ, newZ)
    liveRef.current.zoom   = newZ
    liveRef.current.offset = clamped
    setZoom(newZ)
    setOffset(clamped)
  }, [clamp])

  // ── Export ───────────────────────────────────────────────────────────────
  // Draw only the visible portion of the image onto a canvas and emit a blob.
  const handleConfirm = useCallback(() => {
    if (!ready || !src) return
    setExport(true)
    const box = boxRef.current
    const { zoom: z, offset: { x: ox, y: oy } } = liveRef.current
    const boxW = box.clientWidth, boxH = box.clientHeight
    // Output resolution — 840×220 for banner, 400×400 for avatar
    const outW = aspect > 1.5 ? 840 : 400
    const outH = Math.round(outW / aspect)
    const canvas = document.createElement('canvas')
    canvas.width = outW; canvas.height = outH
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      // Source rect in natural-image coordinates
      ctx.drawImage(img, -ox / z, -oy / z, boxW / z, boxH / z, 0, 0, outW, outH)
      canvas.toBlob(blob => { setExport(false); onConfirm(blob) }, 'image/jpeg', 0.92)
    }
    img.src = src
  }, [ready, src, aspect, onConfirm])

  return (
    // Full-screen overlay — mousemove/mouseup here so dragging beyond the
    // preview box edge still registers correctly.
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onMouseMove={e => moveDrag(e.clientX, e.clientY)}
      onMouseUp={endDrag}
    >
      <div style={{
        background: WHITE, borderRadius: 20, overflow: 'hidden',
        width: '100%', maxWidth: 580,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, color: NAVY2, fontSize: 15 }}>Position your {label}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Drag to reposition · slider to zoom in</div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: MUTED, padding: 4, lineHeight: 1 }}>×</button>
        </div>

        {/* Preview box — aspect-ratio-locked, image draggable inside */}
        <div
          ref={boxRef}
          style={{
            width: '100%', aspectRatio: `${aspect}`, overflow: 'hidden',
            background: '#111', position: 'relative',
            cursor: ready ? 'grab' : 'default',
            userSelect: 'none', touchAction: 'none',
          }}
          onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
          onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={endDrag}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              onLoad={onImgLoad}
              draggable={false}
              alt=""
              style={{
                position: 'absolute',
                left: offset.x, top: offset.y,
                width:  liveRef.current.natural.w * zoom,
                height: liveRef.current.natural.h * zoom,
                display: ready ? 'block' : 'none',
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Rule-of-thirds grid overlay */}
          {ready && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: [
                'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
              ].join(','),
              backgroundSize: '33.33% 33.33%',
            }} />
          )}
          {!ready && src && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Loading…
            </div>
          )}
        </div>

        {/* Zoom slider */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 15, userSelect: 'none' }}>🔍</span>
          <input
            type="range"
            min={minZoom}
            max={minZoom * 3}
            step={minZoom * 0.005}
            value={zoom}
            disabled={!ready}
            onChange={e => applyZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: NAVY }}
          />
          <span style={{ fontSize: 12, color: MUTED, minWidth: 38, textAlign: 'right', fontWeight: 600 }}>
            {ready ? `${Math.round((zoom / minZoom) * 100)}%` : '—'}
          </span>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!ready || exporting}
            style={{
              background: NAVY, color: WHITE, border: 'none', borderRadius: 10,
              padding: '10px 20px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
              cursor: (!ready || exporting) ? 'default' : 'pointer',
              opacity: (!ready || exporting) ? 0.6 : 1,
            }}
          >
            {exporting ? 'Processing…' : `Use this ${label}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Micro-label ───────────────────────────────────────────────────────────────
const Lbl = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
    {children}
  </div>
)

// ── Stat bubble ───────────────────────────────────────────────────────────────
function Stat({ emoji, value, label }) {
  return (
    <div style={{
      background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 140px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: NAVY + '10', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, flexShrink: 0,
      }}>
        {emoji}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: NAVY2, fontFamily: 'Georgia,serif', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

// ── Photo upload button (overlaid on images) ──────────────────────────────────
function UploadBtn({ onClick, uploading, label }) {
  return (
    <button
      onClick={onClick}
      disabled={uploading}
      style={{
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        color: WHITE, border: 'none', borderRadius: 8,
        padding: '6px 12px', fontSize: 12, fontWeight: 600,
        cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'background 0.15s',
      }}
    >
      <span>📷</span> {uploading ? 'Uploading…' : label}
    </button>
  )
}

// ── Editable text field ───────────────────────────────────────────────────────
function EditFld({ label, value, onChange, placeholder, multiline }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl>{label}</Lbl>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...sty.inp, resize: 'vertical', lineHeight: 1.6 }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={sty.inp}
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UserProfile({ session, allVoyages, voyage }) {
  const userId = useUserId()
  const w      = useW()

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    displayName:        '',
    bio:                '',
    homePort:           '',
    favouriteCruiseLine:'',
    favouriteDestination:'',
    avatarUrl:          '',
    bannerUrl:          '',
  })
  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState(profile)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  // Photo upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadError,     setUploadError]     = useState('')

  // Cropper state — set when user picks a file, cleared on confirm or cancel
  const [cropState, setCropState] = useState(null) // { file, type: 'avatar'|'banner' }

  const avatarRef = useRef(null)
  const bannerRef = useRef(null)

  // ── Load profile from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('display_name, bio, home_port, favourite_cruise_line, favourite_destination, avatar_url, banner_url')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const loaded = {
          displayName:         data?.display_name          ?? '',
          bio:                 data?.bio                   ?? '',
          homePort:            data?.home_port             ?? '',
          favouriteCruiseLine: data?.favourite_cruise_line ?? '',
          favouriteDestination:data?.favourite_destination ?? '',
          avatarUrl:           data?.avatar_url            ?? '',
          bannerUrl:           data?.banner_url            ?? '',
        }
        setProfile(loaded)
        setDraft(loaded)
        setLoading(false)
      })
  }, [userId])

  // ── Save profile edits ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      user_id:              userId,
      email:                session?.user?.email ?? '',
      display_name:         draft.displayName,
      bio:                  draft.bio,
      home_port:            draft.homePort,
      favourite_cruise_line:draft.favouriteCruiseLine,
      favourite_destination:draft.favouriteDestination,
    }, { onConflict: 'user_id' })
    setProfile(draft)
    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(profile)
    setEditing(false)
  }

  // ── Upload a cropped blob to Supabase Storage ──────────────────────────────
  const uploadPhotoBlob = async (blob, type) => {
    if (!blob || !userId) return null
    setUploadError('')
    if (blob.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB.')
      return null
    }
    const path = `${userId}/user-profiles/${type}.jpg`
    const { error } = await supabase.storage
      .from('voyage-covers')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (error) { setUploadError('Upload failed — please try again.'); return null }
    const { data: { publicUrl } } = supabase.storage.from('voyage-covers').getPublicUrl(path)
    return publicUrl
  }

  // ── File picker handlers — open the cropper instead of uploading directly ─
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (file) setCropState({ file, type: 'avatar' })
  }

  const handleBannerFileSelect = (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (file) setCropState({ file, type: 'banner' })
  }

  // ── Cropper confirmed — upload the blob ────────────────────────────────────
  const handleCropConfirm = async (blob) => {
    const { type } = cropState
    setCropState(null)
    if (type === 'avatar') setUploadingAvatar(true)
    else                   setUploadingBanner(true)
    const url = await uploadPhotoBlob(blob, type)
    if (url) {
      const dbField    = type === 'avatar' ? 'avatar_url'  : 'banner_url'
      const stateField = type === 'avatar' ? 'avatarUrl'   : 'bannerUrl'
      await supabase.from('profiles').upsert(
        { user_id: userId, email: session?.user?.email ?? '', [dbField]: url },
        { onConflict: 'user_id' }
      )
      setProfile(p => ({ ...p, [stateField]: url }))
      setDraft(p    => ({ ...p, [stateField]: url }))
    }
    if (type === 'avatar') setUploadingAvatar(false)
    else                   setUploadingBanner(false)
  }

  const handleCropCancel = () => setCropState(null)

  // ── Cruise stats ───────────────────────────────────────────────────────────
  const totalVoyages = allVoyages.length
  const totalNights  = allVoyages.reduce((s, v) => s + (parseInt(v.total_nights) || 0), 0)
  const [friendCount, setFriendCount] = useState(null)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq('status', 'accepted')
      .then(({ count }) => setFriendCount(count ?? 0))
  }, [userId])

  const memberSince = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  // Initials fallback for avatar
  const initials = (() => {
    const name  = profile.displayName || session?.user?.email?.split('@')[0] || '?'
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    return words[0].slice(0, 2).toUpperCase()
  })()

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED, fontSize: 14 }}>
      Loading profile…
    </div>
  )

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>

      {/* ── Image cropper modal ─────────────────────────────────────────────── */}
      {cropState && (
        <ImageCropper
          file={cropState.file}
          aspect={cropState.type === 'banner' ? BANNER_ASPECT : 1}
          label={cropState.type === 'banner' ? 'banner photo' : 'profile photo'}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* ── Banner + avatar hero ───────────────────────────────────────────── */}
      <div style={{ borderRadius: 20, overflow: 'visible', marginBottom: 0, position: 'relative' }}>

        {/* Banner */}
        <div style={{
          height: BANNER_H, borderRadius: '20px 20px 0 0', overflow: 'hidden',
          position: 'relative', background: `linear-gradient(135deg, ${NAVY2} 0%, #0EA5E9 60%, ${GOLD}80 100%)`,
          cursor: 'pointer',
        }}
          onClick={() => !uploadingBanner && bannerRef.current?.click()}
        >
          {profile.bannerUrl && (
            <img src={profile.bannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          {/* Gradient vignette at bottom so avatar reads over banner */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35) 100%)' }} />
          {/* Upload button */}
          <div style={{ position: 'absolute', bottom: 12, right: 14 }}>
            <UploadBtn onClick={e => { e.stopPropagation(); bannerRef.current?.click() }} uploading={uploadingBanner} label="Change Banner" />
          </div>
          {!profile.bannerUrl && !uploadingBanner && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}>
              <div style={{ fontSize: 36 }}>🌅</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 }}>Click to add a banner photo</div>
            </div>
          )}
        </div>

        {/* White card beneath banner */}
        <div style={{
          background: WHITE, border: `1px solid ${BORDER}`,
          borderRadius: '0 0 20px 20px', borderTop: 'none',
          padding: `${AVATAR_OVERLAP + 12}px ${w < BP.mobile ? 16 : 24}px 24px`,
          position: 'relative',
        }}>

          {/* Avatar — sits half-over the banner */}
          <div style={{ position: 'absolute', top: -AVATAR_OVERLAP, left: 24 }}>
            <div style={{
              width: AVATAR_SIZE, height: AVATAR_SIZE,
              borderRadius: '50%', overflow: 'hidden',
              border: `${AVATAR_BORDER}px solid ${WHITE}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              background: NAVY2,
              position: 'relative', cursor: 'pointer',
            }}
              onClick={() => !uploadingAvatar && avatarRef.current?.click()}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif' }}>
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
              >
                <span style={{ fontSize: 18, opacity: 0 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >📷</span>
              </div>
              {uploadingAvatar && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 12, color: WHITE, fontWeight: 600 }}>
                  …
                </div>
              )}
            </div>
          </div>

          {/* Name + edit button row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ minWidth: 0, paddingRight: 12 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 400, color: NAVY2, fontFamily: 'Georgia,serif', lineHeight: 1.1 }}>
                {profile.displayName || session?.user?.email?.split('@')[0] || 'Cruiser'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {memberSince && (
                  <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
                    ⚓ Sailing since {memberSince}
                  </span>
                )}
                {session?.user?.email && (
                  <span style={{ fontSize: 12, color: MUTED }}>· {session.user.email}</span>
                )}
              </div>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: CREAM, border: `1px solid ${BORDER}`,
                  color: NAVY, borderRadius: 10, padding: '8px 16px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ ...sty.btn, fontSize: 13, padding: '8px 16px', opacity: saving ? 0.6 : 1, cursor: saving ? 'default' : 'pointer' }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          {editing ? (
            <EditFld
              label="Bio"
              value={draft.bio}
              onChange={v => setDraft(p => ({ ...p, bio: v }))}
              placeholder="Tell your fellow cruisers a bit about yourself…"
              multiline
            />
          ) : (
            profile.bio ? (
              <p style={{ margin: '12px 0 0', fontSize: 14, color: TEXT, lineHeight: 1.7, fontStyle: 'italic' }}>
                "{profile.bio}"
              </p>
            ) : !editing && (
              <p style={{ margin: '12px 0 0', fontSize: 13, color: MUTED, fontStyle: 'italic', cursor: 'pointer' }} onClick={() => setEditing(true)}>
                + Add a bio — tell your voyage story…
              </p>
            )
          )}
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {uploadError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#DC2626', marginTop: 12 }}>
          {uploadError}
        </div>
      )}

      {/* ── Cruise stats ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Your Voyage Stats
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Stat emoji="🚢" value={totalVoyages}          label="Voyages" />
          <Stat emoji="🌙" value={totalNights || '—'}    label="Nights at Sea" />
          <Stat emoji="👥" value={friendCount ?? '—'}    label="Cruise Friends" />
          <Stat emoji="🌍" value="—"                     label="Ports Visited" />
        </div>
      </div>

      {/* ── Personal details ──────────────────────────────────────────────── */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: w < BP.mobile ? 16 : '22px 24px', marginTop: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
          About Me
        </div>

        {editing ? (
          <>
            <EditFld label="Display Name" value={draft.displayName} onChange={v => setDraft(p => ({ ...p, displayName: v }))} placeholder="Your name as cruise friends will see it" />
            <EditFld label="Home Port" value={draft.homePort} onChange={v => setDraft(p => ({ ...p, homePort: v }))} placeholder="e.g. Southampton" />
            <EditFld label="Favourite Cruise Line" value={draft.favouriteCruiseLine} onChange={v => setDraft(p => ({ ...p, favouriteCruiseLine: v }))} placeholder="e.g. P&O Cruises" />
            <EditFld label="Favourite Destination" value={draft.favouriteDestination} onChange={v => setDraft(p => ({ ...p, favouriteDestination: v }))} placeholder="e.g. Norwegian Fjords" />
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { emoji: '🏠', label: 'Home Port',            value: profile.homePort             },
              { emoji: '⚓', label: 'Favourite Line',       value: profile.favouriteCruiseLine  },
              { emoji: '🌴', label: 'Favourite Destination', value: profile.favouriteDestination },
              { emoji: '✉️', label: 'Email',                value: session?.user?.email         },
            ].map(({ emoji, label, value }) => (
              <div key={label}>
                <Lbl>{label}</Lbl>
                <div style={{ fontSize: 14, color: value ? TEXT : MUTED, fontStyle: value ? 'normal' : 'italic', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span>{emoji}</span>
                  <span>{value || 'Not set'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file inputs — open the cropper modal instead of uploading directly */}
      <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileSelect} />
      <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerFileSelect} />

    </div>
  )
}
