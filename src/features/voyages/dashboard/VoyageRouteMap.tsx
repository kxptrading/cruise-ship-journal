// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/dashboard/VoyageRouteMap.tsx — Interactive Leaflet route map
//
// Uses plain Leaflet imperatively (no react-leaflet) to avoid React context
// version incompatibilities. The map is created in a useEffect, all layers
// are added via Leaflet's own API, and React only manages the wrapper UI.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { resolvePort } from '@/lib/portCoords'
import { BORDER, MUTED, NAVY2, WHITE, FONT_BODY, TEAL } from '@/constants'
import type { ItineraryDay, DailyLog, Voyage } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type StopType = 'departure' | 'port' | 'missed-port' | 'return'

interface RouteStop {
  id: string
  name: string
  type: StopType
  lat: number
  lng: number
  date: string
  label: string
  dayIndex: number
  notes: string
  rating: number
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const NAVY_HEX = '#1B3A5C'
const GOLD_HEX = '#C9A227'
const TEAL_HEX = '#0D6B55'
const ROSE_HEX = '#B03060'

const STOP_CONFIG: Record<StopType, { emoji: string; bg: string; border: string }> = {
  departure:     { emoji: '🚢', bg: NAVY_HEX, border: GOLD_HEX },
  port:          { emoji: '⚓', bg: TEAL_HEX, border: '#10B981' },
  'missed-port': { emoji: '⚠️', bg: ROSE_HEX, border: '#DC4C8A' },
  return:        { emoji: '🏁', bg: GOLD_HEX, border: NAVY_HEX },
}

const STOP_LABEL: Record<StopType, string> = {
  departure:     'Departure Port',
  port:          'Port Day',
  'missed-port': 'Missed Port',
  return:        'Return Port',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function renderStars(rating: number): string {
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < rating ? GOLD_HEX : '#E0DBD0'}">★</span>`
  ).join('')
}

function createStopIcon(type: StopType, highlighted = false) {
  const { emoji, bg, border } = STOP_CONFIG[type]
  const size = highlighted ? 44 : 38
  const fontSize = highlighted ? 20 : 17
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:3px solid ${border};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${fontSize}px;
      box-shadow:0 3px 10px rgba(0,0,0,0.35);
      cursor:pointer;
    ">${emoji}</div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 6],
  })
}

// Build a popup DOM element so we can attach real event listeners
function createPopupEl(
  stop: RouteStop,
  onViewDay?: (i: number) => void,
  onNav?: (s: string) => void,
): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `font-family:${FONT_BODY};padding:2px 0;min-width:190px;max-width:240px`

  const typeBadgeBg =
    stop.type === 'departure'    ? 'rgba(27,58,92,0.08)'   :
    stop.type === 'return'       ? 'rgba(201,162,39,0.12)' :
    stop.type === 'missed-port'  ? 'rgba(176,48,96,0.1)'   :
    'rgba(13,107,85,0.1)'
  const typeBadgeColor =
    stop.type === 'departure'    ? NAVY_HEX :
    stop.type === 'return'       ? GOLD_HEX :
    stop.type === 'missed-port'  ? ROSE_HEX :
    TEAL_HEX

  el.innerHTML = `
    <div style="font-size:16px;font-weight:700;color:${NAVY_HEX};margin-bottom:5px;line-height:1.2">
      ${stop.name}
    </div>
    <div style="margin-bottom:6px">
      <span style="
        font-size:11px;font-weight:600;
        color:${typeBadgeColor};background:${typeBadgeBg};
        border-radius:20px;padding:2px 8px;
      ">${STOP_CONFIG[stop.type].emoji} ${stop.label}</span>
    </div>
    ${stop.date ? `<div style="font-size:12px;color:#6B7280;margin-bottom:6px">📅 ${fmtDate(stop.date)}</div>` : ''}
    ${stop.notes ? `
      <div style="
        font-size:12px;color:#374151;line-height:1.55;margin-bottom:6px;
        font-style:italic;border-left:3px solid #E5E7EB;padding-left:8px;
      ">"${stop.notes}"</div>
    ` : ''}
    ${stop.rating > 0 ? `<div style="font-size:14px;margin-bottom:6px">${renderStars(stop.rating)}</div>` : ''}
  `

  if (onViewDay && stop.type === 'port') {
    const btn = document.createElement('button')
    btn.textContent = 'View Day Log →'
    btn.style.cssText = `
      margin-top:8px;width:100%;
      background:${NAVY_HEX};color:#fff;border:none;
      border-radius:7px;padding:7px 12px;
      font-size:12px;font-family:${FONT_BODY};font-weight:700;
      cursor:pointer;letter-spacing:0.01em;
    `
    btn.addEventListener('click', () => onViewDay(stop.dayIndex))
    el.appendChild(btn)
  }

  if (onNav && (stop.type === 'departure' || stop.type === 'return')) {
    const btn = document.createElement('button')
    btn.textContent = 'View Itinerary'
    btn.style.cssText = `
      margin-top:8px;width:100%;
      background:transparent;color:${NAVY_HEX};
      border:1px solid #E5E7EB;border-radius:7px;padding:6px 12px;
      font-size:11px;font-family:${FONT_BODY};font-weight:600;cursor:pointer;
    `
    btn.addEventListener('click', () => onNav('itinerary'))
    el.appendChild(btn)
  }

  return el
}

// Inject sailing animation CSS once
const ANIM_STYLE_ID = 'voyage-route-anim'
function ensureAnimCSS() {
  if (document.getElementById(ANIM_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = ANIM_STYLE_ID
  s.textContent = `@keyframes sailDash{to{stroke-dashoffset:-30}}.route-pulse{animation:sailDash .7s linear infinite}`
  document.head.appendChild(s)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  voyage:     Voyage
  itinerary:  ItineraryDay[]
  dailyLogs:  DailyLog[]
  onNav?:     (section: string) => void
  onViewDay?: (dayIndex: number) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoyageRouteMap({ voyage, itinerary, dailyLogs, onNav, onViewDay }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef    = useRef<L.Map | null>(null)

  const mapHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 360

  // ── Derive route stops ───────────────────────────────────────────────────────
  const stops = useMemo<RouteStop[]>(() => {
    const raw: RouteStop[] = []
    itinerary.forEach((day, i) => {
      if (!day.port || day.port.toLowerCase().includes('sea')) return
      const coords = resolvePort(day.port)
      if (!coords) return
      const [lng, lat] = coords
      const log = dailyLogs.find(l => l.date === day.date) ?? dailyLogs.find(l => l.port === day.port)
      raw.push({
        id:       `${day.port.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        name:     day.port,
        type:     'port',
        lat, lng,
        date:     day.date,
        label:    STOP_LABEL['port'],
        dayIndex: i,
        notes:    log?.bestMoment || log?.highlights || '',
        rating:   log?.rating || 0,
      })
    })
    if (raw.length === 0) return []
    return raw.map((s, i) => {
      const type: StopType = i === 0 ? 'departure' : i === raw.length - 1 ? 'return' : 'port'
      return { ...s, type, label: STOP_LABEL[type] }
    })
  }, [itinerary, dailyLogs])

  const deduped = useMemo(() => {
    const out: RouteStop[] = []
    for (const s of stops) {
      const last = out[out.length - 1]
      if (!last || last.name !== s.name) out.push(s)
    }
    return out
  }, [stops])

  const positions = useMemo<[number, number][]>(() =>
    deduped.map(s => [s.lat, s.lng]), [deduped])

  // ── Summary stats ────────────────────────────────────────────────────────────
  const nights       = parseInt(String(voyage.totalNights)) || itinerary.filter(d => d.date || d.port).length
  const portCount    = useMemo(() => deduped.filter(s => s.type === 'port').length, [deduped])
  const memoriesCount = useMemo(() => dailyLogs.filter(l => l.bestMoment || l.highlights).length, [dailyLogs])
  const bestPort     = useMemo(() => {
    const rated = deduped.filter(s => s.type === 'port' && s.rating > 0)
    return rated.length ? rated.reduce((a, b) => b.rating > a.rating ? b : a).name : null
  }, [deduped])

  // ── Imperative Leaflet map ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || deduped.length === 0) return

    // Destroy previous instance if re-running
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    // Initialise with the first port as center so Leaflet has a valid starting
    // view before fitBounds runs. Without this, Leaflet has no coordinate
    // reference frame and falls back to (0, 0) when fitBounds is called against
    // a not-yet-painted container.
    const map = L.map(mapDivRef.current, {
      center:           positions[0],
      zoom:             5,
      scrollWheelZoom:  false,
      zoomControl:      true,
    })
    mapRef.current = map

    // CartoDB Voyager tiles — clean ocean look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
      maxZoom: 20,
    }).addTo(map)

    // Animated route line
    if (positions.length >= 2) {
      ensureAnimCSS()
      L.polyline(positions as L.LatLngExpression[], {
        color: NAVY_HEX, weight: 4, opacity: 0.5,
      }).addTo(map)
      L.polyline(positions as L.LatLngExpression[], {
        color: GOLD_HEX, weight: 3, dashArray: '12 18',
        className: 'route-pulse', opacity: 0.95,
      }).addTo(map)
    }

    // Markers with popups
    deduped.forEach(stop => {
      const isEndpoint = stop.type === 'departure' || stop.type === 'return'
      const marker = L.marker([stop.lat, stop.lng], {
        icon: createStopIcon(stop.type, isEndpoint),
      })
      marker.bindPopup(createPopupEl(stop, onViewDay, onNav), { minWidth: 200 })
      marker.addTo(map)
    })

    // Force Leaflet to re-read the container dimensions (guards against the map
    // div being measured at 0×0 during the initial React paint), then fit bounds.
    map.invalidateSize()

    if (positions.length === 1) {
      map.setView(positions[0], 8)
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [50, 50], maxZoom: 9 })
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  // Only re-run when stop coordinates or callbacks change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deduped.length, positions.length])

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (deduped.length === 0) {
    return (
      <div style={{
        background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14,
        padding: '32px 24px', marginBottom: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🗺️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY, marginBottom: 6 }}>
          Voyage Route Map
        </div>
        <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY, lineHeight: 1.65, maxWidth: 300, margin: '0 auto 22px' }}>
          Route map will appear once ports are added to your itinerary.
        </div>
        {onNav && (
          <button
            onClick={() => onNav('itinerary')}
            style={{
              background: NAVY_HEX, color: WHITE, border: 'none', borderRadius: 8,
              padding: '9px 22px', fontSize: 13, fontFamily: FONT_BODY,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Add itinerary stops →
          </button>
        )}
      </div>
    )
  }

  const firstStop  = deduped[0]
  const lastStop   = deduped[deduped.length - 1]
  const routeLabel = deduped.length > 1
    ? `${firstStop.name} → ${lastStop.name}`
    : firstStop.name

  return (
    <div style={{
      background: WHITE, border: `1px solid ${BORDER}`,
      borderRadius: 14, marginBottom: 16, overflow: 'hidden',
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 20px 13px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: MUTED,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontFamily: FONT_BODY, marginBottom: 3,
          }}>
            Voyage Route
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>
            {routeLabel}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 180 }}>
          {deduped.map(s => (
            <span key={s.id} style={{
              fontSize: 10, fontWeight: 600, fontFamily: FONT_BODY,
              color:
                s.type === 'departure'    ? NAVY_HEX :
                s.type === 'return'       ? GOLD_HEX :
                s.type === 'missed-port'  ? ROSE_HEX : TEAL,
              background:
                s.type === 'departure'    ? 'rgba(27,58,92,0.08)'   :
                s.type === 'return'       ? 'rgba(201,162,39,0.12)' :
                s.type === 'missed-port'  ? 'rgba(176,48,96,0.1)'   :
                'rgba(13,107,85,0.1)',
              borderRadius: 20, padding: '3px 8px',
            }}>
              {STOP_CONFIG[s.type].emoji} {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Map canvas ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: mapHeight }}>
        <div ref={mapDivRef} style={{ height: mapHeight, width: '100%' }} />

        {/* Night counter badge */}
        {nights > 0 && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1000,
            background: 'rgba(27,58,92,0.9)', color: WHITE,
            borderRadius: 20, padding: '5px 12px', fontSize: 11,
            fontFamily: FONT_BODY, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', letterSpacing: '0.02em',
            pointerEvents: 'none',
          }}>
            🌙 {nights} night{nights !== 1 ? 's' : ''}
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 1000,
          background: 'rgba(255,255,255,0.92)', borderRadius: 10,
          padding: '7px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', gap: 3,
          pointerEvents: 'none',
        }}>
          {([
            ['departure', 'Departure'],
            ['port',      'Port stop'],
            ['return',    'Return'],
          ] as [StopType, string][]).map(([type, lbl]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12 }}>{STOP_CONFIG[type].emoji}</span>
              <span style={{ fontSize: 10, color: '#374151', fontFamily: FONT_BODY, fontWeight: 600 }}>
                {lbl}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary bar ────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${BORDER}`,
        background: '#F9F7F3',
        display: 'grid',
        gridTemplateColumns: `repeat(${bestPort ? 4 : 3}, 1fr)`,
        padding: '2px 0',
      }}>
        {([
          { icon: '🌙', value: nights > 0 ? String(nights) : '—', label: 'Nights' },
          { icon: '⚓', value: portCount > 0 ? String(portCount) : '—', label: 'Port stops' },
          { icon: '📖', value: memoriesCount > 0 ? String(memoriesCount) : '—', label: 'Memories' },
          ...(bestPort ? [{ icon: '🏆', value: bestPort, label: 'Best port' }] : []),
        ] as { icon: string; value: string; label: string }[]).map((stat, i, arr) => (
          <div key={i} style={{
            padding: '10px 8px', textAlign: 'center',
            borderRight: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none',
          }}>
            <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 3 }}>{stat.icon}</div>
            <div style={{
              fontSize: stat.label === 'Best port' ? 11 : 15,
              fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY,
              lineHeight: 1.2, marginBottom: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 10, color: MUTED, fontFamily: FONT_BODY,
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
