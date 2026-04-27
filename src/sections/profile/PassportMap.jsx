// ─────────────────────────────────────────────────────────────────────────────
// profile/PassportMap.jsx — Real world map with port pins
//
// Uses react-simple-maps (D3-geo under the hood) for an accurate
// equirectangular world map rendered entirely as SVG.
// Port pins are placed by lat/lng via the same projection.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { NAVY2, GOLD, WHITE, BORDER, MUTED, TEAL, ROSE, PLUM, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { PORTS, MAP_SUMMARY } from './profileData'

// Natural Earth 110m countries TopoJSON — hosted on the react-simple-maps CDN
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Legend row
function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: MUTED, fontWeight: 600, fontFamily: FONT_BODY }}>{label}</span>
    </div>
  )
}

export default function PassportMap() {
  const [tooltip, setTooltip] = useState(null) // { name, x, y }

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1.6 1 0', minWidth: 0 }}>

      {/* Header */}
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

      {/* Map */}
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#B8D4E8' }}>
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 153, center: [15, 10] }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {/* Countries */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
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

          {/* Port markers */}
          {PORTS.map(port => (
            <Marker
              key={port.name}
              coordinates={[port.lng, port.lat]}
              onMouseEnter={e => setTooltip({ name: port.name, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Outer pulse ring */}
              <circle r={port.color === GOLD ? 5 : 4} fill={port.color} fillOpacity={0.2} />
              {/* Inner dot */}
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

        {/* Summary chip */}
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

      {/* Hover tooltip — fixed to cursor */}
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
