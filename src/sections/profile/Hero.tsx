// ─────────────────────────────────────────────────────────────────────────────
// profile/Hero.tsx — Full-bleed banner, circular avatar, and stat strip
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { NAVY2, GOLD, WHITE, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { useW } from '../../context'
import FE from '../../components/FE'

const BANNER_H      = 260
const AVATAR_SIZE   = 92
const AVATAR_BORDER = 4

function Wave() {
  return (
    <svg
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 48, display: 'block', pointerEvents: 'none' }}
    >
      <path d="M0,24 C240,48 480,8 720,28 C960,48 1200,12 1440,24 L1440,48 L0,48 Z" fill="white" opacity="0.13" />
      <path d="M0,36 C360,16 720,44 1080,30 C1260,24 1350,38 1440,36 L1440,48 L0,48 Z" fill="white" opacity="0.07" />
    </svg>
  )
}

interface StatCellProps {
  emoji:  string
  value:  string | number
  label:  string
  border: boolean
}

function StatCell({ emoji, value, label, border }: StatCellProps) {
  const w  = useW()
  const sm = w < 400
  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: sm ? '10px 6px' : '12px 8px',
      borderLeft: border ? '1px solid rgba(255,255,255,0.18)' : 'none',
    }}>
      <div style={{ marginBottom: 3 }}><FE emoji={emoji} size={sm ? 23 : 27} /></div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: sm ? 18 : 22, color: GOLD, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: sm ? 8 : 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, textAlign: 'center' }}>{label}</div>
    </div>
  )
}

export interface UserProfile {
  displayName?:          string
  bannerUrl?:            string | null
  avatarUrl?:            string | null
  homePort?:             string
  bio?:                  string
  favouriteCruiseLine?:  string
}

interface CurrentVoyage {
  id:              string
  ship_name?:      string | null
  departure_date?: string | null
  return_date?:    string | null
  total_nights?:   number | string | null
}

interface Props {
  profile:         UserProfile
  session:         Session | null
  allVoyages:      CurrentVoyage[]
  currentVoyage:   CurrentVoyage | null | undefined
  onUploadAvatar:  () => void
  onUploadBanner:  () => void
  uploadingAvatar: boolean
  uploadingBanner: boolean
  onNameChange?:   (name: string) => void
}

export default function Hero({ profile, session, allVoyages, currentVoyage, onUploadAvatar, onUploadBanner, uploadingAvatar, uploadingBanner, onNameChange }: Props) {
  const w        = useW()
  const isMobile = w < 640

  const [editingName, setEditingName] = useState<boolean>(false)
  const [nameInput,   setNameInput]   = useState<string>('')
  const nameInputRef  = useRef<HTMLInputElement>(null)
  const committedRef  = useRef(false)

  const commitName = useCallback(() => {
    if (committedRef.current) return
    committedRef.current = true
    const trimmed = nameInput.trim()
    if (trimmed) onNameChange?.(trimmed)
    setEditingName(false)
  }, [nameInput, onNameChange])

  const [portCount,  setPortCount]  = useState<number | null>(null)
  const [daysLogged, setDaysLogged] = useState<number | null>(null)

  useEffect(() => {
    if (!currentVoyage?.id) { setPortCount(null); setDaysLogged(null); return }
    const id = currentVoyage.id
    Promise.all([
      supabase.from('itinerary').select('port').eq('voyage_id', id),
      supabase.from('daily_logs').select('id', { count: 'exact', head: true }).eq('voyage_id', id),
    ]).then(([itinRes, logsRes]) => {
      const ports = (itinRes.data ?? []).filter((r: { port: string }) => r.port && !/^at sea$/i.test(r.port.trim()))
      setPortCount(ports.length)
      setDaysLogged(logsRes.count ?? 0)
    })
  }, [currentVoyage?.id])

  const displayName = profile.displayName || session?.user?.email?.split('@')[0] || 'Cruiser'
  const initials = (() => {
    const words = displayName.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    return words[0].slice(0, 2).toUpperCase()
  })()

  const totalVoyages = allVoyages.length
  const voyageNights = parseInt(String(currentVoyage?.total_nights)) || null

  const todayTs = Date.now()
  const isActivelySailing = currentVoyage && (() => {
    const dep = currentVoyage.departure_date ? new Date(currentVoyage.departure_date + 'T00:00:00').getTime() : null
    const ret = currentVoyage.return_date    ? new Date(currentVoyage.return_date    + 'T00:00:00').getTime() : null
    return dep && ret && todayTs >= dep && todayTs <= ret
  })()

  const nextVoyage = allVoyages
    .filter(v => v.departure_date && new Date(v.departure_date + 'T00:00:00') > new Date())
    .sort((a, b) => new Date(a.departure_date!).getTime() - new Date(b.departure_date!).getTime())[0]

  const memberSince = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null

  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 20, position: 'relative', fontFamily: FONT_BODY }}>

      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <div
        style={{
          height: BANNER_H,
          background: 'linear-gradient(135deg, var(--t-primary-dk) 0%, var(--t-primary) 55%, var(--t-primary-lt) 100%)',
          position: 'relative', overflow: 'hidden', cursor: 'pointer',
        }}
        onClick={() => !uploadingBanner && onUploadBanner()}
      >
        {profile.bannerUrl && (
          <img src={profile.bannerUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `${GOLD}22`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, right: 60, width: 100, height: 100, borderRadius: '50%', background: `${GOLD}14`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(3,105,161,0.55) 100%)', pointerEvents: 'none' }} />
        {!profile.bannerUrl && !uploadingBanner && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ marginBottom: 8 }}><FE emoji="🌅" size={32} /></div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>Click to add a banner photo</div>
          </div>
        )}
        {!profile.bannerUrl && (
          <button
            onClick={e => { e.stopPropagation(); onUploadBanner() }}
            disabled={uploadingBanner}
            style={{
              position: 'absolute', bottom: 56, right: 14,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
              color: WHITE, border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8,
              padding: '5px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: FONT_BODY, letterSpacing: '0.04em',
            }}
          >
            <FE emoji="📷" size={11} /> {uploadingBanner ? 'Uploading…' : 'Change Banner'}
          </button>
        )}
        <Wave />
      </div>

      {/* ── White card below banner ──────────────────────────────────────── */}
      <div style={{ background: WHITE, padding: isMobile ? '0 16px 20px' : '0 28px 24px', position: 'relative' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>

          {/* Avatar */}
          <div style={{ marginTop: -(AVATAR_SIZE / 2 + AVATAR_BORDER), flexShrink: 0 }}>
            <div
              onClick={() => !uploadingAvatar && onUploadAvatar()}
              style={{
                width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%',
                border: `${AVATAR_BORDER}px solid ${WHITE}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.22)', overflow: 'hidden',
                background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                cursor: 'pointer', position: 'relative', flexShrink: 0,
              }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_DISPLAY, fontSize: 36, color: WHITE }}>
                  {initials}
                </div>
              )}
              {uploadingAvatar && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: WHITE, fontSize: 12, fontWeight: 700 }}>…</div>
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(3,105,161,0.6)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
              CAPTAIN'S LOG
            </div>

            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
                onBlur={commitName}
                autoFocus
                style={{
                  fontFamily: FONT_DISPLAY, fontSize: isMobile ? 24 : 34,
                  color: NAVY2, lineHeight: 1.05, border: 'none',
                  borderBottom: `2px solid var(--t-primary)`,
                  outline: 'none', background: 'transparent',
                  width: '100%', padding: '2px 0', marginBottom: 4,
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 6 : 10, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 24 : 34, color: NAVY2, lineHeight: 1.05 }}>
                  {displayName}
                </h1>
                <button
                  onClick={() => { committedRef.current = false; setNameInput(displayName); setEditingName(true) }}
                  title="Edit name"
                  style={{
                    background: '#F3F4F6', border: `1px solid ${BORDER}`,
                    borderRadius: 8, padding: isMobile ? '3px 8px' : '4px 10px', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: MUTED,
                    fontFamily: FONT_BODY, flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <FE emoji="✏️" size={11} /> Edit
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              {currentVoyage?.ship_name && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700,
                  color: isActivelySailing ? '#15803D' : MUTED,
                  background: isActivelySailing ? '#DCFCE7' : '#F3F4F6',
                  border: `1px solid ${isActivelySailing ? '#86EFAC' : BORDER}`,
                  borderRadius: 20, padding: '4px 12px',
                }}>
                  {isActivelySailing && (
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 0 2px #86EFAC' }} />
                  )}
                  <FE emoji="🚢" size={12} /> {currentVoyage.ship_name}
                  {!isActivelySailing && currentVoyage.departure_date && (
                    <span style={{ fontWeight: 400, opacity: 0.75 }}>
                      · {new Date(currentVoyage.departure_date + 'T00:00:00').getFullYear()}
                    </span>
                  )}
                </span>
              )}

              {profile.homePort && <span style={{ fontSize: 12, color: MUTED }}><FE emoji="📍" size={12} /> {profile.homePort}</span>}
              {memberSince      && <span style={{ fontSize: 12, color: MUTED }}><FE emoji="🗓" size={12} /> Sailing since {memberSince}</span>}
              {profile.favouriteCruiseLine && (
                <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, borderRadius: 20, padding: '2px 9px' }}>
                  <FE emoji="✨" size={11} /> {profile.favouriteCruiseLine}
                </span>
              )}
            </div>
          </div>

          {/* Next Voyage block */}
          {nextVoyage && !isMobile && (
            <div style={{ background: `${'#1B3A5C'}12`, border: `1px solid ${'#1B3A5C'}30`, borderRadius: 14, padding: '10px 16px', textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Next Voyage</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: NAVY2, marginBottom: 2 }}>
                {nextVoyage.ship_name || 'TBC'}
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>
                {nextVoyage.departure_date
                  ? new Date(nextVoyage.departure_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Date TBC'}
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ margin: '0 0 18px', fontSize: 14, color: TEXT, lineHeight: 1.7, fontStyle: 'italic', borderLeft: `3px solid ${GOLD}`, paddingLeft: 14 }}>
            "{profile.bio}"
          </p>
        )}

        {/* ── Frosted stat strip ────────────────────────────────────────────── */}
        {w < 400 ? (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'rgba(3,105,161,0.72)',
            backdropFilter: 'blur(12px)',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.18)',
            overflow: 'hidden',
          }}>
            <StatCell emoji="🚢" value={totalVoyages}         label="My Voyages"  border={false} />
            <StatCell emoji="🌙" value={voyageNights ?? '—'}  label="Nights"      border={true}  />
            <StatCell emoji="📍" value={portCount    ?? '—'}  label="Ports"       border={false} />
            <StatCell emoji="📖" value={daysLogged   ?? '—'}  label="Days Logged" border={true}  />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            background: 'rgba(3,105,161,0.72)',
            backdropFilter: 'blur(12px)',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.18)',
            overflow: 'hidden',
          }}>
            <StatCell emoji="🚢" value={totalVoyages}         label="My Voyages"  border={false} />
            <StatCell emoji="🌙" value={voyageNights ?? '—'}  label="Nights"      border={true}  />
            <StatCell emoji="📍" value={portCount    ?? '—'}  label="Ports"       border={true}  />
            <StatCell emoji="📖" value={daysLogged   ?? '—'}  label="Days Logged" border={true}  />
          </div>
        )}

        {currentVoyage && (
          <div style={{ marginTop: 8, fontSize: 10, color: MUTED, textAlign: 'right' }}>
            Nights · Ports · Days Logged shown for {currentVoyage.ship_name || 'current voyage'}
          </div>
        )}
      </div>
    </div>
  )
}
