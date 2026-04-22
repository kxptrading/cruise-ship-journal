// ─────────────────────────────────────────────────────────────────────────────
// sections/UserProfile.jsx — Profile page root
//
// Fetches real profile data from Supabase, keeps avatar/banner upload with the
// interactive ImageCropper, then delegates rendering to sub-components:
//
//   Hero            — banner, avatar, stat strip
//   PassportMap     — world map with port pins
//   Personality     — cruise DNA trait rows
//   Badges          — achievement badge grid
//   Companions      — scrollable shipmate cards
//   VoyagesStrip    — compact voyage cards
//   Preferences     — auto-fill preference rows
//   SettingsBlock   — export actions + sign-out
//
// Where to plug in live data
// ──────────────────────────
// • Badges: replace BADGES in profileData.js with a Supabase query on a
//   `user_badges` table; same shape { emoji, name, earned, color }.
// • Companions: replace COMPANIONS with a query joining friend_requests +
//   profiles; same shape { initials, name, relation, voyages, color }.
// • Preferences: replace PREFERENCES with user preferences from a DB table.
// • Traits: derive from journal data or store in a `user_traits` table.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUserId } from '../context'
import { FONT_BODY } from '../constants'

import Hero          from './profile/Hero'
import PassportMap   from './profile/PassportMap'
import Personality   from './profile/Personality'
import Badges        from './profile/Badges'
import Companions    from './profile/Companions'
import VoyagesStrip  from './profile/VoyagesStrip'
import Preferences   from './profile/Preferences'
import SettingsBlock from './profile/SettingsBlock'

// ── Image Cropper Modal ───────────────────────────────────────────────────────
// Opens after the user picks a file. They drag to reposition and use the zoom
// slider to frame their shot. A canvas export captures only the visible area
// (400×400 for avatar, 840×220 for banner) as a JPEG blob — nothing is
// uploaded until the user confirms.
const BANNER_ASPECT = 840 / 220

function ImageCropper({ file, aspect, label, onConfirm, onCancel }) {
  const [src,       setSrc]    = useState(null)
  const [zoom,      setZoom]   = useState(1)
  const [offset,    setOffset] = useState({ x: 0, y: 0 })
  const [minZoom,   setMinZoom] = useState(1)
  const [ready,     setReady]  = useState(false)
  const [exporting, setExport] = useState(false)

  const boxRef  = useRef(null)
  const imgRef  = useRef(null)
  const dragRef = useRef(null)
  const liveRef = useRef({ zoom: 1, offset: { x: 0, y: 0 }, natural: { w: 0, h: 0 } })

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const clamp = useCallback((ox, oy, z) => {
    const box = boxRef.current
    if (!box) return { x: ox, y: oy }
    const { w, h } = liveRef.current.natural
    return {
      x: Math.min(0, Math.max(ox, box.clientWidth  - w * z)),
      y: Math.min(0, Math.max(oy, box.clientHeight - h * z)),
    }
  }, [])

  const onImgLoad = useCallback(() => {
    const img = imgRef.current, box = boxRef.current
    if (!img || !box) return
    const nat = { w: img.naturalWidth, h: img.naturalHeight }
    liveRef.current.natural = nat
    const mz = Math.max(box.clientWidth / nat.w, box.clientHeight / nat.h)
    const initOff = { x: (box.clientWidth - nat.w * mz) / 2, y: (box.clientHeight - nat.h * mz) / 2 }
    liveRef.current.zoom = mz; liveRef.current.offset = initOff
    setMinZoom(mz); setZoom(mz); setOffset(initOff); setReady(true)
  }, [])

  const startDrag = useCallback((cx, cy) => {
    dragRef.current = { sx: cx, sy: cy, ox: liveRef.current.offset.x, oy: liveRef.current.offset.y }
  }, [])

  const moveDrag = useCallback((cx, cy) => {
    if (!dragRef.current) return
    const { sx, sy, ox, oy } = dragRef.current
    const clamped = clamp(ox + cx - sx, oy + cy - sy, liveRef.current.zoom)
    liveRef.current.offset = clamped; setOffset({ ...clamped })
  }, [clamp])

  const endDrag = useCallback(() => { dragRef.current = null }, [])

  const applyZoom = useCallback((newZ) => {
    const box = boxRef.current; if (!box) return
    const { zoom: oldZ, offset: { x: ox, y: oy } } = liveRef.current
    const cx = box.clientWidth / 2, cy = box.clientHeight / 2
    const imgPx = (cx - ox) / oldZ, imgPy = (cy - oy) / oldZ
    const clamped = clamp(cx - imgPx * newZ, cy - imgPy * newZ, newZ)
    liveRef.current.zoom = newZ; liveRef.current.offset = clamped
    setZoom(newZ); setOffset(clamped)
  }, [clamp])

  const handleConfirm = useCallback(() => {
    if (!ready || !src) return; setExport(true)
    const box = boxRef.current
    const { zoom: z, offset: { x: ox, y: oy } } = liveRef.current
    const boxW = box.clientWidth, boxH = box.clientHeight
    const outW = aspect > 1.5 ? 840 : 400, outH = Math.round(outW / aspect)
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

  const NAVY  = 'var(--t-primary)'
  const NAVY2 = 'var(--t-primary-dk)'
  const BORDER = '#E5E7EB'
  const WHITE = '#FFFFFF'
  const MUTED = '#6B7280'

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseMove={e => moveDrag(e.clientX, e.clientY)}
      onMouseUp={endDrag}
    >
      <div style={{ background: WHITE, borderRadius: 20, overflow: 'hidden', width: '100%', maxWidth: 580, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, color: NAVY2, fontSize: 15, fontFamily: FONT_BODY }}>Position your {label}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2, fontFamily: FONT_BODY }}>Drag to reposition · slider to zoom in</div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: MUTED, padding: 4, lineHeight: 1 }}>×</button>
        </div>
        <div
          ref={boxRef}
          style={{ width: '100%', aspectRatio: `${aspect}`, overflow: 'hidden', background: '#111', position: 'relative', cursor: ready ? 'grab' : 'default', userSelect: 'none', touchAction: 'none' }}
          onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
          onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={endDrag}
        >
          {src && (
            <img ref={imgRef} src={src} onLoad={onImgLoad} draggable={false} alt=""
              style={{ position: 'absolute', left: offset.x, top: offset.y, width: liveRef.current.natural.w * zoom, height: liveRef.current.natural.h * zoom, display: ready ? 'block' : 'none', pointerEvents: 'none' }} />
          )}
          {ready && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: ['linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', 'linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)'].join(','), backgroundSize: '33.33% 33.33%' }} />
          )}
          {!ready && src && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: FONT_BODY }}>Loading…</div>
          )}
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 15 }}>🔍</span>
          <input type="range" min={minZoom} max={minZoom * 3} step={minZoom * 0.005} value={zoom} disabled={!ready} onChange={e => applyZoom(parseFloat(e.target.value))} style={{ flex: 1, accentColor: NAVY }} />
          <span style={{ fontSize: 12, color: MUTED, minWidth: 38, textAlign: 'right', fontWeight: 600, fontFamily: FONT_BODY }}>{ready ? `${Math.round((zoom / minZoom) * 100)}%` : '—'}</span>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: FONT_BODY }}>Cancel</button>
          <button onClick={handleConfirm} disabled={!ready || exporting}
            style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, fontFamily: FONT_BODY, cursor: (!ready || exporting) ? 'default' : 'pointer', opacity: (!ready || exporting) ? 0.6 : 1 }}>
            {exporting ? 'Processing…' : `Use this ${label}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function UserProfile({ session, allVoyages, voyage, onNav }) {
  const userId = useUserId()

  const [profile, setProfile] = useState({ displayName: '', bio: '', homePort: '', favouriteCruiseLine: '', favouriteDestination: '', avatarUrl: '', bannerUrl: '' })
  const [loading,         setLoading]         = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadError,     setUploadError]     = useState('')
  const [cropState,       setCropState]       = useState(null) // { file, type }
  const [friendCount,     setFriendCount]     = useState(null)

  const avatarRef = useRef(null)
  const bannerRef = useRef(null)

  // ── Load profile ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('display_name, bio, home_port, favourite_cruise_line, favourite_destination, avatar_url, banner_url')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({
          displayName:          data.display_name          ?? '',
          bio:                  data.bio                   ?? '',
          homePort:             data.home_port             ?? '',
          favouriteCruiseLine:  data.favourite_cruise_line ?? '',
          favouriteDestination: data.favourite_destination ?? '',
          avatarUrl:            data.avatar_url            ?? '',
          bannerUrl:            data.banner_url            ?? '',
        })
        setLoading(false)
      })
  }, [userId])

  // ── Friend count ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq('status', 'accepted')
      .then(({ count }) => setFriendCount(count ?? 0))
  }, [userId])

  // ── Derived stats from real data ──────────────────────────────────────────────
  const dailyLogsCount = voyage && Array.isArray(voyage) ? 0
    : 0 // real count passed from allVoyages daily logs — fetched via prop if needed

  // Count unique non-sea ports across all voyages from the itinerary prop
  const uniquePorts = 15 // seed — replace with DB query when itinerary is aggregated

  // ── Upload blob → Supabase Storage ───────────────────────────────────────────
  const uploadPhotoBlob = async (blob, type) => {
    if (!blob || !userId) return null
    setUploadError('')
    if (blob.size > 10 * 1024 * 1024) { setUploadError('Image must be under 10 MB.'); return null }
    const path = `${userId}/user-profiles/${type}.jpg`
    const { error } = await supabase.storage.from('voyage-covers').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (error) { setUploadError('Upload failed — please try again.'); return null }
    const { data: { publicUrl } } = supabase.storage.from('voyage-covers').getPublicUrl(path)
    return publicUrl
  }

  // ── File pickers → open cropper ───────────────────────────────────────────────
  const handleAvatarFileSelect = e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setCropState({ file: f, type: 'avatar' }) }
  const handleBannerFileSelect = e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setCropState({ file: f, type: 'banner' }) }

  // ── Cropper confirmed ─────────────────────────────────────────────────────────
  const handleCropConfirm = async (blob) => {
    const { type } = cropState
    setCropState(null)
    if (type === 'avatar') setUploadingAvatar(true)
    else                   setUploadingBanner(true)
    const url = await uploadPhotoBlob(blob, type)
    if (url) {
      const dbField    = type === 'avatar' ? 'avatar_url'  : 'banner_url'
      const stateField = type === 'avatar' ? 'avatarUrl'   : 'bannerUrl'
      await supabase.from('profiles').upsert({ user_id: userId, email: session?.user?.email ?? '', [dbField]: url }, { onConflict: 'user_id' })
      setProfile(p => ({ ...p, [stateField]: url }))
    }
    if (type === 'avatar') setUploadingAvatar(false)
    else                   setUploadingBanner(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280', fontSize: 14, fontFamily: FONT_BODY }}>
      Loading profile…
    </div>
  )

  return (
    <div style={{ fontFamily: FONT_BODY }}>

      {/* Cropper modal */}
      {cropState && (
        <ImageCropper
          file={cropState.file}
          aspect={cropState.type === 'banner' ? BANNER_ASPECT : 1}
          label={cropState.type === 'banner' ? 'banner photo' : 'profile photo'}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropState(null)}
        />
      )}

      {/* Upload error */}
      {uploadError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
          {uploadError}
        </div>
      )}

      {/* 1. Hero */}
      <Hero
        profile={profile}
        session={session}
        allVoyages={allVoyages}
        dailyLogsCount={dailyLogsCount}
        uniquePorts={uniquePorts}
        friendCount={friendCount}
        onUploadAvatar={() => avatarRef.current?.click()}
        onUploadBanner={() => bannerRef.current?.click()}
        uploadingAvatar={uploadingAvatar}
        uploadingBanner={uploadingBanner}
      />

      {/* 2. Passport map + Personality */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 20, flexWrap: 'wrap' }}>
        <PassportMap />
        <Personality />
      </div>

      {/* 3. Badges */}
      <Badges />

      {/* 4. Companions */}
      <Companions />

      {/* 5. Voyages */}
      <VoyagesStrip allVoyages={allVoyages} onViewAll={() => onNav?.('voyage')} />

      {/* 6. Preferences + Settings */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <Preferences />
        <SettingsBlock onSignOut={() => supabase.auth.signOut()} />
      </div>

      {/* Hidden file inputs */}
      <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileSelect} />
      <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerFileSelect} />
    </div>
  )
}
