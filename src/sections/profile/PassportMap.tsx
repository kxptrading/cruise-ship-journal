// ─────────────────────────────────────────────────────────────────────────────
// profile/PassportMap.tsx — Ports Visited world map
//
// Queries all itinerary entries across every voyage for the current user,
// resolves port names to coordinates, and pins them on a world map.
// Each voyage gets a distinct colour; the legend lists voyage ship names.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { supabase } from '../../lib/supabase'
import { resolvePort } from '../../lib/portCoords'
import { useUserId } from '../../context'
import { NAVY2, WHITE, BORDER, MUTED, FONT_DISPLAY, FONT_BODY } from '../../constants'
import type { VoyageListRow } from '../../types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Colour palette — one per voyage, cycling if more than 6
const VOYAGE_COLORS = ['#0D6B55', '#4A3B8C', '#B03060', '#C9A227', '#0EA5E9', '#8B5CF6']

interface PortPin {
  name:       string
  coords:     [number, number]
  color:      string
  voyageId:   string
}

interface Tooltip {
  name: string
  x:    number
  y:    number
}

interface Props {
  allVoyages: VoyageListRow[]
}

export default function PassportMap({ allVoyages }: Props) {
  const userId    = useUserId()
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  // Build voyage id → color + label maps
  const voyageColorMap = useMemo(() =>
    Object.fromEntries(allVoyages.map((v, i) => [v.id, VOYAGE_COLORS[i % VOYAGE_COLORS.length]])),
    [allVoyages]
  )
  const voyageLabelMap = useMemo(() =>
    Object.fromEntries(allVoyages.map((v, i) => [
      v.id,
      v.ship_name || `Voyage ${i + 1}`,
    ])),
    [allVoyages]
  )

  const voyageIds = useMemo(() => allVoyages.map(v => v.id), [allVoyages])

  // Fetch all itinerary ports across all voyages for this user
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['passport-ports', userId, voyageIds],
    queryFn: async () => {
      if (!voyageIds.length) return []
      const { data, error } = await supabase
        .from('itinerary')
        .select('port, voyage_id')
        .in('voyage_id', voyageIds)
      if (error) throw error
      return (data ?? []) as { port: string; voyage_id: string }[]
    },
    enabled: !!userId && voyageIds.length > 0,
    staleTime: 60_000,
  })

  // Resolve port names → coordinates, deduplicate by name (keep first voyage's colour)
  const pins = useMemo<PortPin[]>(() => {
    const seen = new Set<string>()
    const result: PortPin[] = []
    for (const row of rows) {
      if (!row.port) continue
      const name = row.port.trim()
      if (!name || name.toLowerCase().includes('sea')) continue
      const coords = resolvePort(name)
      if (!coords) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      result.push({
        name,
        coords,
        color:     voyageColorMap[row.voyage_id] ?? VOYAGE_COLORS[0],
        voyageId:  row.voyage_id,
      })
    }
    return result
  }, [rows, voyageColorMap])

  // Voyages that actually contributed at least one visible pin
  const activeVoyages = useMemo(() => {
    const ids = new Set(pins.map(p => p.voyageId))
    return allVoyages.filter(v => ids.has(v.id))
  }, [pins, allVoyages])

  const summary = pins.length
    ? `${pins.length} port${pins.length !== 1 ? 's' : ''} · ${activeVoyages.length} voyage${activeVoyages.length !== 1 ? 's' : ''}`
    : null

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1.6 1 0', minWidth: 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>PASSPORT</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Ports Visited</h2>
        </div>
        {/* Voyage legend */}
        {activeVoyages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            {activeVoyages.slice(0, 4).map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: voyageColorMap[v.id], flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: MUTED, fontWeight: 600, fontFamily: FONT_BODY }}>
                  {voyageLabelMap[v.id]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#B8D4E8' }}>
        {isLoading ? (
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>Loading ports…</span>
          </div>
        ) : (
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 153, center: [15, 10] }}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo: { rsmKey: string }) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: { fill: '#D4E8D0', stroke: '#A8CCA4', strokeWidth: 0.4, outline: 'none' },
                      hover:   { fill: '#C5DFBF', stroke: '#A8CCA4', strokeWidth: 0.4, outline: 'none' },
                      pressed: { fill: '#C5DFBF', outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {pins.map(pin => (
              <Marker
                key={pin.name}
                coordinates={pin.coords}
                onMouseEnter={(e: React.MouseEvent) => setTooltip({ name: pin.name, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              >
                <circle r={5} fill={pin.color} fillOpacity={0.2} />
                <circle r={3} fill={pin.color} stroke={WHITE} strokeWidth={0.8} style={{ cursor: 'pointer' }} />
              </Marker>
            ))}
          </ComposableMap>
        )}

        {/* Summary pill */}
        {summary && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
            borderRadius: 20, padding: '5px 12px',
            fontSize: 10, fontWeight: 700, color: NAVY2,
            border: `1px solid ${BORDER}`, fontFamily: FONT_BODY,
          }}>
            {summary}
          </div>
        )}

        {/* Empty state overlay */}
        {!isLoading && pins.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.7)',
          }}>
            <span style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY, fontWeight: 600 }}>
              Add ports to your itinerary to see them here
            </span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 10, top: tooltip.y - 30, zIndex: 9999,
          background: NAVY2, color: WHITE, borderRadius: 8,
          padding: '4px 10px', fontSize: 11, fontWeight: 600,
          pointerEvents: 'none', fontFamily: FONT_BODY,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {tooltip.name}
        </div>
      )}
    </div>
  )
}
