// ─────────────────────────────────────────────────────────────────────────────
// sections/DayDetail.tsx — Read-only diary card for a single day
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, TEAL, ROSE, CORAL, LIGHT, BP, sty, FONT_DISPLAY, FONT_BODY, WX_EMOJI, WX_STYLE } from '../constants'
import { useW, useVoyageId } from '../context'
import { getPhotos } from '../lib/photoStorage'
import type { DailyLog, ItineraryDay } from '../types'
import type { PhotoRecord } from '../types'

interface MealItem {
  icon:  string
  label: string
  text:  string
}

interface Props {
  dayIndex:  number
  log:       Partial<DailyLog>
  itinerary: ItineraryDay[]
  onBack:    () => void
  onEdit:    () => void
}

export default function DayDetail({ dayIndex, log, itinerary, onBack, onEdit }: Props) {
  const w        = useW()
  const voyageId = useVoyageId()
  const [photos,  setPhotos]  = useState<PhotoRecord[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    if (!voyageId) return
    getPhotos(dayIndex + 1, { voyageId }).then(setPhotos).catch(() => setPhotos([]))
  }, [dayIndex, voyageId])

  const isGenericLabel = (v: string | undefined) => v === 'Port' || v === 'Sea'
  const port    = (log.port && !isGenericLabel(log.port)) ? log.port : (itinerary[dayIndex]?.port || '')
  const date    = log.date
  const weather = log.weather || []
  const meals: MealItem[] = [
    log.breakfast ? { icon: '🍳', label: 'Breakfast', text: log.breakfast } : null,
    log.lunch     ? { icon: '🥗', label: 'Lunch',     text: log.lunch }     : null,
    log.dinner    ? { icon: '🍝', label: 'Dinner',    text: log.dinner }    : null,
    log.drink     ? { icon: '🍷', label: 'Drinks',    text: log.drink }     : null,
  ].filter((m): m is MealItem => m !== null)

  const pad = w < BP.mobile ? 16 : 24

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: NAVY2, fontSize: 14, fontWeight: 700, fontFamily: FONT_BODY, padding: '0 0 20px 0' }}
      >
        ← Back to Feed
      </button>

      <div style={{
        background: 'linear-gradient(135deg, var(--t-primary-dk) 0%, var(--t-primary) 100%)',
        borderRadius: 20, overflow: 'hidden', marginBottom: 16,
        boxShadow: '0 8px 32px var(--t-btn-shadow)',
      }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: WHITE, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: FONT_BODY }}>
              Day {dayIndex + 1}
            </div>
            {(log.rating ?? 0) > 0 && (
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: 18, color: n <= (log.rating ?? 0) ? GOLD : 'rgba(255,255,255,0.2)' }}>★</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ fontSize: w < BP.mobile ? 32 : 40, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1.1, marginBottom: 6 }}>
            {port || `Day ${dayIndex + 1}`}
          </div>

          {formattedDate && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: 14 }}>
              📅 {formattedDate}
            </div>
          )}

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

      {photos.length > 1 && (
        <div style={{ ...sty.card, padding: pad }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: FONT_BODY }}>📷 Photos</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {photos.map((p, i) => (
              <div key={p.id} onClick={() => setLightbox(p.dataUrl)} style={{ flexShrink: 0, cursor: 'pointer' }}>
                <img src={p.dataUrl} alt={p.caption || `Photo ${i + 1}`} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                {p.caption && (
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {log.highlights && (
        <div style={{ ...sty.card, padding: pad }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📖 Journal</div>
          <p style={{ margin: 0, fontSize: 16, color: TEXT, lineHeight: 1.8, fontWeight: 400 }}>{log.highlights}</p>
        </div>
      )}

      {log.bestMoment && (
        <div style={{ ...sty.card, padding: pad, borderLeft: `4px solid ${CORAL}`, background: 'rgba(249,115,22,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: CORAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>✨ Best Moment</div>
          <p style={{ margin: 0, fontSize: w < BP.mobile ? 20 : 24, color: '#92400E', fontFamily: FONT_DISPLAY, fontWeight: 400, lineHeight: 1.5 }}>
            "{log.bestMoment}"
          </p>
        </div>
      )}

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

      {log.entertainment && (
        <div style={{ ...sty.card, padding: pad }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>🎭 Evening</div>
          <div style={{ fontSize: 15, color: TEXT, fontWeight: 600, lineHeight: 1.6 }}>{log.entertainment}</div>
        </div>
      )}

      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <button onClick={onEdit} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '9px 22px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED, fontWeight: 600 }}>
          ✏️ Edit this day
        </button>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}
