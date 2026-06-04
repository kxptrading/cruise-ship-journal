// ─────────────────────────────────────────────────────────────────────────────
// components/ui/metric-card.tsx — Animated metric card
//
// Usage:
//   <MetricCard
//     icon="📅" value={6} label="Days Logged" sub="out of 14"
//     color="#0EA5E9" ring={43}
//   />
//   <MetricCard
//     icon="💳" value="£420" label="Total Spent" color="#10B981"
//     pct={60} alert={false}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { motion, animate } from 'framer-motion'
import { WHITE, BORDER, FONT_DISPLAY, FONT_BODY, MUTED } from '../../constants'
import FE from '../FE'

// ── Animated donut ring ──────────────────────────────────────────────────────

interface DonutProps {
  pct?:   number
  size?:  number
  color?: string
  thick?: number
  alert?: boolean
}

function AnimatedDonut({ pct = 0, size = 52, color = '#0EA5E9', thick = 5, alert }: DonutProps) {
  const r    = (size / 2) - thick
  const circ = 2 * Math.PI * r
  const target = (Math.min(100, Math.max(0, pct)) / 100) * circ
  const alertColor = alert ? '#DC2626' : color

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BORDER} strokeWidth={thick} />
        {/* Fill — animated via motion */}
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={alertColor} strokeWidth={thick}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${target} ${circ}` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: alertColor, fontFamily: FONT_BODY,
      }}>
        {Math.round(pct)}%
      </div>
    </div>
  )
}

// ── Count-up value ───────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1.2): number {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)
  useEffect(() => {
    const from = prevRef.current
    prevRef.current = target
    const controls = animate(from, target, {
      duration,
      ease: 'easeOut',
      onUpdate: v => setDisplay(Math.round(v)),
    })
    return controls.stop
  }, [target, duration])
  return display
}

// ── MetricCard ───────────────────────────────────────────────────────────────

// ── Inline sparkline ─────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const w = 80, h = 26
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }))
  // Smooth cubic bezier path
  const d = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M${pt.x},${pt.y}`
    const prev = pts[i - 1]
    const cx   = (prev.x + pt.x) / 2
    return `${acc} C${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`
  }, '')
  return (
    <svg width={w} height={h} style={{ display: 'block', marginTop: 6, overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
    </svg>
  )
}

export interface MetricCardProps {
  icon:       string           // emoji shown in coloured badge
  value:      string | number  // numeric values animate; strings display as-is
  label:      string
  sub?:       string
  color:      string
  pct?:       number           // progress bar (0-100)
  ring?:      number           // donut ring (0-100)
  alert?:     boolean          // turns ring/progress red when true
  sparkline?: number[]         // optional mini line chart below the metric
}

export function MetricCard({ icon, value, label, sub, color, pct, ring, alert, sparkline }: MetricCardProps) {
  const isNumeric = typeof value === 'number'
  const counted   = useCountUp(isNumeric ? value : 0)
  const displayed = isNumeric ? counted : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: `linear-gradient(135deg, ${WHITE} 60%, ${color}18 100%)`,
        borderRadius: 14,
        border: `1px solid ${BORDER}`,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 148,
      }}
    >
      {/* Top row: icon badge + optional donut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: color + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FE emoji={icon} size={26} />
        </div>
        {ring !== undefined && (
          <AnimatedDonut pct={ring} size={52} color={color} thick={5} alert={alert} />
        )}
      </div>

      {/* Bottom row: value + label + sub + progress bar */}
      <div>
        <div style={{ fontSize: 24, fontWeight: 400, color: 'var(--t-primary-dk)', fontFamily: FONT_DISPLAY, lineHeight: 1, marginBottom: 3 }}>
          {displayed}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: sub ? 6 : 0, fontFamily: FONT_BODY }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4, fontFamily: FONT_BODY }}>
            {sub}
          </div>
        )}
        {pct !== undefined && (
          <div style={{ marginTop: 10, height: 3, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, pct)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
              style={{ height: '100%', background: alert ? '#DC2626' : color, borderRadius: 2 }}
            />
          </div>
        )}
        {sparkline && sparkline.some(v => v > 0) && (
          <Sparkline data={sparkline} color={alert ? '#DC2626' : color} />
        )}
      </div>
    </motion.div>
  )
}
