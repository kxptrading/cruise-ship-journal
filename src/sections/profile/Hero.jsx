// ─────────────────────────────────────────────────────────────────────────────
// profile/Hero.jsx — Full-bleed banner, circular avatar, and stat strip
//
// Layout (top → bottom):
//   1. 260px gradient banner with decorative circles + wave
//   2. Avatar overlapping the banner edge, name block, next-voyage block
//   3. Frosted 5-column stat strip
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, NAVY2, GOLD, WHITE, BORDER, MUTED, TEXT, TEAL, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { useW } from '../../context'

const BANNER_H      = 260
const AVATAR_SIZE   = 92
const AVATAR_BORDER = 4

// ── Wave SVG drawn along the banner's bottom edge ─────────────────────────────
function Wave() {
  return (
    <svg
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 48, display: 'block', pointerEvents: 'none' }}
    >
      <path
        d="M0,24 C240,48 480,8 720,28 C960,48 1200,12 1440,24 L1440,48 L0,48 Z"
        fill="white"
        opacity="0.13"
      />
      <path
        d="M0,36 C360,16 720,44 1080,30 C1260,24 1350,38 1440,36 L1440,48 L0,48 Z"
        fill="white"
        opacity="0.07"
      />
    </svg>
  )
}

// ── Single stat cell in the frosted strip ─────────────────────────────────────
function StatCell({ emoji, value, label, border }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 8px',
      borderLeft: border ? '1px solid rgba(255,255,255,0.18)' : 'none',
    }}>
      <div style={{ fontSize: 18, marginBottom: 3 }}>{emoji}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: GOLD, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3, textAlign: 'center' }}>{label}</div>
    </div>
  )
}

export default function Hero({
  profile, session, allVoyages,
  dailyLogsCount, uniquePorts,
  friendCount,
  onUploadAvatar, onUploadBanner,
  uploadingAvatar, uploadingBanner,
}) {
  const w = useW()
  const isMobile = w < 640

  // Derive display values
  const displayName = profile.displayName || session?.user?.email?.split('@')[0] || 'Cruiser'
  const initials = (() => {
    const words = displayName.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    return words[0].slice(0, 2).toUpperCase()
  })()

  const totalVoyages = allVoyages.length
  const totalNights  = allVoyages.reduce((s, v) => s + (parseInt(v.total_nights) || 0), 0)

  // Next upcoming voyage
  const nextVoyage = allVoyages
    .filter(v => v.departure_date && new Date(v.departure_date + 'T00:00:00') > new Date())
    .sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date))[0]

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
        {/* Banner photo */}
        {profile.bannerUrl && (
          <img src={profile.bannerUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}

        {/* Decorative amber circles top-right */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `${GOLD}22`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, right: 60, width: 100, height: 100, borderRadius: '50%', background: `${GOLD}14`, pointerEvents: 'none' }} />

        {/* Dark vignette at bottom */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(3,105,161,0.55) 100%)', pointerEvents: 'none' }} />

        {/* Change banner hint */}
        {!profile.bannerUrl && !uploadingBanner && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌅</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>Click to add a banner photo</div>
          </div>
        )}

        {/* Change banner button — only shown before a banner has been uploaded */}
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
            📷 {uploadingBanner ? 'Uploading…' : 'Change Banner'}
          </button>
        )}

        <Wave />
      </div>

      {/* ── White card below banner ──────────────────────────────────────── */}
      <div style={{ background: WHITE, padding: isMobile ? '0 16px 20px' : '0 28px 24px', position: 'relative' }}>

        {/* Avatar + name row */}
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
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(3,105,161,0.6)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3 }}>
              CAPTAIN'S LOG
            </div>
            <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 26 : 34, color: NAVY2, lineHeight: 1.05 }}>
              {displayName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              {profile.homePort && (
                <span style={{ fontSize: 12, color: MUTED }}>📍 {profile.homePort}</span>
              )}
              {memberSince && (
                <span style={{ fontSize: 12, color: MUTED }}>🗓 Sailing since {memberSince}</span>
              )}
              {profile.favouriteCruiseLine && (
                <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, borderRadius: 20, padding: '2px 9px' }}>
                  ✨ {profile.favouriteCruiseLine}
                </span>
              )}
            </div>
          </div>

          {/* Next Voyage block */}
          {nextVoyage && !isMobile && (
            <div style={{ background: `${NAVY}12`, border: `1px solid ${NAVY}30`, borderRadius: 14, padding: '10px 16px', textAlign: 'right', flexShrink: 0 }}>
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

        {/* ── Frosted stat strip ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          background: 'rgba(3,105,161,0.72)',
          backdropFilter: 'blur(12px)',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.18)',
          overflow: 'hidden',
        }}>
          <StatCell emoji="🚢" value={totalVoyages}        label="Voyages"      border={false} />
          <StatCell emoji="🌙" value={totalNights || '—'}  label="Nights at Sea" border={true} />
          <StatCell emoji="📍" value={uniquePorts || '—'}  label="Ports"         border={true} />
          <StatCell emoji="🌍" value={9}                   label="Countries"     border={true} />
          <StatCell emoji="📖" value={dailyLogsCount || 0} label="Days Logged"   border={true} />
        </div>
      </div>
    </div>
  )
}
