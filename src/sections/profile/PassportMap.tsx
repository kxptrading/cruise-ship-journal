// ─────────────────────────────────────────────────────────────────────────────
// profile/PassportMap.tsx — Real world map with port pins
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { NAVY2, GOLD, WHITE, BORDER, MUTED, TEAL, ROSE, PLUM, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { PORTS, MAP_SUMMARY } from './profileData'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface LegendDotProps {
  color: string
  label: string
}

function LegendDot({ color, label }: LegendDotProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: MUTED, fontWeight: 600, fontFamily: FONT_BODY }}>{label}</span>
    </div>
  )
}

interface Tooltip {
  name: string
  x:    number
  y:    number
}

export default function PassportMap() {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1.6 1 0', minWidth: 0 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>PASSPORT</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Ports Visited</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <LegendDot color={TEAL} label="Mediterranean" />
          <LegendDot color={PLUM} label="Caribbean"     />
          <LegendDot color={ROSE} label="Nordic"        />
        </div>
      </div>

      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#B8D4E8' }}>
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

          {PORTS.map(port => (
            <Marker
              key={port.name}
              coordinates={[port.lng, port.lat]}
              onMouseEnter={(e: React.MouseEvent) => setTooltip({ name: port.name, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle r={port.color === GOLD ? 5 : 4} fill={port.color} fillOpacity={0.2} />
              <circle
                r={port.color === GOLD ? 3 : 2.5}
                fill={port.color}
                stroke={WHITE}
                strokeWidth={0.8}
                style={{ cursor: 'pointer' }}
              />
            </Marker>
          ))}
        </ComposableMap>

        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
          borderRadius: 20, padding: '5px 12px',
          fontSize: 10, fontWeight: 700, color: NAVY2,
          border: `1px solid ${BORDER}`,
          fontFamily: FONT_BODY,
        }}>
          {MAP_SUMMARY}
        </div>
      </div>

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
