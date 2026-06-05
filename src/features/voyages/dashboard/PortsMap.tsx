// ─────────────────────────────────────────────────────────────────────────────
// sections/dashboard/PortsMap.tsx — Port route map (react-simple-maps)
//
// Lazy-loaded by Dashboard.tsx so the main bundle stays fast.
// Uses a hardcoded dictionary of common cruise port coordinates.
// Ports that aren't in the dictionary are silently skipped.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps'
import { BORDER, MUTED, TEAL, WHITE, FONT_BODY } from '@/constants'
import type { ItineraryDay } from '@/types'
import { resolvePort } from '@/lib/portCoords'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface PortPoint {
  name:   string
  coords: [number, number]
  dayNum: number
  isSea:  boolean
}

interface Props {
  itinerary: ItineraryDay[]
}

export default function PortsMap({ itinerary }: Props) {
  const points = useMemo<PortPoint[]>(() => {
    const pts: PortPoint[] = []
    itinerary.forEach((day, i) => {
      if (!day.port) return
      const isSea = day.port.toLowerCase().includes('sea')
      if (isSea) return
      const coords = resolvePort(day.port)
      if (coords) pts.push({ name: day.port, coords, dayNum: i + 1, isSea: false })
    })
    return pts
  }, [itinerary])

  if (points.length === 0) {
    return (
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily: FONT_BODY }}>
          Ports Map
        </div>
        <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
          Add ports to your itinerary to see the route map.
        </div>
      </div>
    )
  }

  // Compute bounding box + projection center/scale
  const lngs = points.map(p => p.coords[0])
  const lats = points.map(p => p.coords[1])
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const centerLng = (minLng + maxLng) / 2
  const centerLat = (minLat + maxLat) / 2
  const spread = Math.max(maxLng - minLng, maxLat - minLat)
  const scale = spread > 100 ? 120 : spread > 60 ? 180 : spread > 30 ? 280 : spread > 10 ? 420 : 600

  // Deduplicate consecutive identical ports
  const routePoints: PortPoint[] = []
  for (const pt of points) {
    const last = routePoints[routePoints.length - 1]
    if (!last || last.name !== pt.name) routePoints.push(pt)
  }

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT_BODY }}>
          Route Map
        </div>
        <div style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>
          {routePoints.length} port{routePoints.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Map */}
      <div style={{ background: '#EFF6FF', borderTop: `1px solid ${BORDER}` }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [centerLng, centerLat], scale }}
          style={{ width: '100%', height: 260 }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#DBEAFE"
                  stroke="#BFDBFE"
                  strokeWidth={0.5}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                />
              ))
            }
          </Geographies>

          {/* Route line */}
          {routePoints.length > 1 && routePoints.map((pt, i) => {
            if (i === 0) return null
            return (
              <Line
                key={`line-${i}`}
                from={routePoints[i - 1].coords}
                to={pt.coords}
                stroke={TEAL}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeLinecap="round"
              />
            )
          })}

          {/* Port markers */}
          {routePoints.map((pt, i) => {
            const isFirst = i === 0
            const isLast  = i === routePoints.length - 1
            const markerColor = isFirst ? 'var(--t-primary-dk)' : isLast ? TEAL : TEAL

            return (
              <Marker key={`pin-${i}`} coordinates={pt.coords}>
                <circle r={isFirst || isLast ? 5 : 4} fill={markerColor} stroke={WHITE} strokeWidth={1.5} />
                <text
                  y={-8}
                  textAnchor="middle"
                  style={{
                    fontSize:   9,
                    fill:       'var(--t-primary-dk)',
                    fontFamily: FONT_BODY,
                    fontWeight: 600,
                    pointerEvents: 'none',
                    paintOrder: 'stroke',
                    stroke:     WHITE,
                    strokeWidth: 2,
                  }}
                >
                  {pt.name.length > 14 ? pt.name.slice(0, 13) + '…' : pt.name}
                </text>
              </Marker>
            )
          })}
        </ComposableMap>
      </div>
    </div>
  )
}
