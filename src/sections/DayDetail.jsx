// ─────────────────────────────────────────────────────────────────────────────
// sections/DayDetail.jsx — Read-only diary card for a single day
//
// Opened from the Feed when the user taps "View Full Day →" on a post card.
// Renders all logged data for that day (highlights, meals, excursion, weather,
// entertainment, rating, photos) in a magazine-style layout. No editing — the
// user goes to Daily Log for that.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, TEAL, ROSE, CORAL, LIGHT, BP, sty, FONT_DISPLAY, FONT_BODY } from '../constants'
import { useW, useVoyageId } from '../context'
import { getPhotos } from '../lib/photoStorage'

const WX_EMOJI = {
  Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️',
  Windy: '💨', Hot: '🌡️', Mild: '🌤️', Cool: '❄️',
}
const WX_STYLE = {
  Sunny:  { background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' },
  Hot:    { background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B' },
  Rainy:  { background: '#EFF6FF', border: '1px solid #93C5FD', color: '#1D4ED8' },
  Cloudy: { background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151' },
  Windy:  { background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155' },
  Mild:   { background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534' },
  Cool:   { background: '#EFF6FF', border: '1px solid #BAE6FD', color: '#0369A1' },
}

export default function DayDetail({ dayIndex, log, itinerary, onBack, onEdit }) {
  const w        = useW()
  const voyageId = useVoyageId()
  const [photos, setPhotos] = useState([])
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (!voyageId) return
    getPhotos(dayIndex, { voyageId }).then(setPhotos).catch(() => setPhotos([]))
  }, [dayIndex, voyageId])

  const port    = log.port || itinerary[dayIndex]?.port || ''
  const date    = log.date
  const weather = log.weather || []
  const meals   = [
    log.breakfast && { icon: '🍳', label: 'Breakfast', text: log.breakfast },
    log.lunch     && { icon: '🥗', label: 'Lunch',     text: log.lunch },
    log.dinner    && { icon: '🍝', label: 'Dinner',    text: log.dinner },
    log.drink     && { icon: '🍷', label: 'Drinks',    text: log.drink },
  ].filter(Boolean)

  const pad = w < BP.mobile ? 16 : 24

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ fontFamily: FONT_BODY }}>

      {/* ── Back button ─────────────────────────────────────────────────── */}
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: NAVY2, fontSize: 14, fontWeight: 700, fontFamily: FONT_BODY, padding: '0 0 20px 0' }}
      >
        ← Back to Feed
      </button>

      {/* ── Hero card ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--t-primary-dk) 0%, var(--t-primary) 100%)',
        borderRadius: 20, overflow: 'hidden', marginBottom: 16,
        boxShadow: '0 8px 32px var(--t-btn-shadow)',
      }}>
        {/* Photo banner — first photo if available */}
        {photos.length > 0 && (
          <div style={{ height: w < BP.mobile ? 200 : 280, overflow: 'hidden' }}>
            <img
              src={photos[0].dataUrl}
              alt={photos[0].caption || port}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
              onClick={() => setLightbox(photos[0].dataUrl)}
            />
          </div>
        )}

        <div style={{ padding: w < BP.mobile ? '22px 18px' : '28px 32px' }}>
          {/* Day badge + rating row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: WHITE, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: FONT_BODY }}>
              Day {dayIndex + 1}
            </div>
            {log.rating > 0 && (
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: 18, color: n <= log.rating ? GOLD : 'rgba(255,255,255,0.2)' }}>★</span>
                ))}
              </div>
            )}
          </div>

          {/* Port / ship name */}
          <div style={{ fontSize: w < BP.mobile ? 32 : 40, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1.1, marginBottom: 6 }}>
            {port || `Day ${dayIndex + 1}`}
          </div>

          {/* Date */}
          {formattedDate && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: 14 }}>
              📅 {formattedDate}
            </div>
          )}

          {/* Weather chips */}
          {weather.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {weather.map(wx => (
                <span key={wx} style={{ fontSize: 12, borderRadius: 20, padding: '4px 12px', fontWeight: 600, ...(WX_STYLE[wx] || { background: 'rgba(255,255,255,0.15)', color: WHITE }) }}>
                  {WX_EMOJI[wx] || '🌈'} {wx}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Photo strip — remaining photos ──────────────────────────────── */}
      {photos.length > 1 && (
        <div style={{ ...sty.card, padding: pad }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: FONT_BODY }}>
            📷 Photos
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {photos.map((p, i) => (
              <div key={p.id} onClick={() => setLightbox(p.dataUrl)} style={{ flexShrink: 0, cursor: 'pointer' }}>
                <img
                  src={p.dataUrl}
                  alt={p.caption || `Photo ${i + 1}`}
                  style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 10, display: 'block' }}
                />
                {p.caption && (
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Highlights ──────────────────────────────────────────────────── */}
      {log.highlights && (
        <div style={{ ...sty.card, padding: pad }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📖 Journal</div>
          <p style={{ margin: 0, fontSize: 16, color: TEXT, lineHeight: 1.8, fontWeight: 400 }}>{log.highlights}</p>
        </div>
      )}

      {/* ── Best Moment ─────────────────────────────────────────────────── */}
      {log.bestMoment && (
        <div style={{ ...sty.card, padding: pad, borderLeft: `4px solid ${CORAL}`, background: 'rgba(249,115,22,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: CORAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>✨ Best Moment</div>
          <p style={{ margin: 0, fontSize: w < BP.mobile ? 20 : 24, color: '#92400E', fontFamily: FONT_DISPLAY, fontWeight: 400, lineHeight: 1.5 }}>
            "{log.bestMoment}"
          </p>
        </div>
      )}

      {/* ── Meals ───────────────────────────────────────────────────────── */}
      {meals.length > 0 && (
        <div style={{ ...sty.card, padding: pad }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>🍽️ What I Ate</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {meals.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px', background: LIGHT, borderRadius: 12 }}>
                <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 15, color: TEXT, fontWeight: 600 }}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Excursion ───────────────────────────────────────────────────── */}
      {(log.activity || log.excNotes) && (
        <div style={{ ...sty.card, padding: pad, borderLeft: `4px solid ${TEAL}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🚤 Shore Excursion</div>
          {log.activity && <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{log.activity}</div>}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: log.excNotes ? 10 : 0 }}>
            {log.duration && <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>⏱ {log.duration}</span>}
            {log.excCost  && <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>💰 £{log.excCost}</span>}
          </div>
          {log.excNotes && <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.7 }}>{log.excNotes}</p>}
        </div>
      )}

      {/* ── Entertainment ───────────────────────────────────────────────── */}
      {log.entertainment && (
        <div style={{ ...sty.card, padding: pad }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>🎭 Evening</div>
          <div style={{ fontSize: 15, color: TEXT, fontWeight: 600, lineHeight: 1.6 }}>{log.entertainment}</div>
        </div>
      )}

      {/* ── Edit nudge ──────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <button
          onClick={onEdit}
          style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '9px 22px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED, fontWeight: 600 }}
        >
          ✏️ Edit this day
        </button>
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}
