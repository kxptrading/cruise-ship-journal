// ─────────────────────────────────────────────────────────────────────────────
// sections/dashboard/BudgetBreakdown.tsx — Interactive stacked budget bar
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion } from 'framer-motion'
import { WHITE, BORDER, MUTED, TEAL, ROSE, GOLD, FONT_BODY, FONT_DISPLAY } from '../../constants'
import type { Budget } from '../../types'

const CATEGORIES = ['Excursions', 'Drinks', 'Shopping', 'Dining', 'Other'] as const

const CAT_COLORS: Record<string, string> = {
  Excursions: TEAL,
  Drinks:     '#06B6D4',
  Shopping:   GOLD,
  Dining:     '#F97316',
  Other:      '#94A3B8',
}

function normalizeCategory(cat: string): string {
  const c = (cat || '').trim().toLowerCase()
  if (c.includes('excursion') || c.includes('activity') || c.includes('tour')) return 'Excursions'
  if (c.includes('drink') || c.includes('bar') || c.includes('alcohol') || c.includes('beverage')) return 'Drinks'
  if (c.includes('shop') || c.includes('souvenir') || c.includes('gift') || c.includes('retail')) return 'Shopping'
  if (c.includes('dine') || c.includes('dining') || c.includes('restaurant') || c.includes('food') || c.includes('meal')) return 'Dining'
  return 'Other'
}

interface Props {
  budget: Budget
}

export default function BudgetBreakdown({ budget }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const total = parseFloat(String(budget.budget)) || 0
  const spent = (budget.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const overBudget = total > 0 && spent > total

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    sum: (budget.items || [])
      .filter(i => normalizeCategory(i.category) === cat)
      .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0),
  })).filter(c => c.sum > 0)

  if (!spent) {
    return (
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily: FONT_BODY }}>Budget Breakdown</div>
        <div style={{ fontSize: 14, color: MUTED, fontFamily: FONT_BODY }}>No spending recorded yet.</div>
      </div>
    )
  }

  const hoveredItem = byCategory.find(c => c.cat === hovered)

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT_BODY }}>
          Budget Breakdown
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {overBudget && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              style={{ fontSize: 10, fontWeight: 700, color: ROSE, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT_BODY }}
            >
              Over Budget
            </motion.span>
          )}
          <span style={{ fontSize: 15, fontWeight: 400, fontFamily: FONT_DISPLAY, color: overBudget ? ROSE : 'var(--t-primary-dk)' }}>
            £{spent.toFixed(0)}{total > 0 ? ` / £${total.toFixed(0)}` : ''}
          </span>
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{ position: 'relative', height: 32, borderRadius: 8, background: BORDER, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {byCategory.map(({ cat, sum }, idx) => {
            const pct = (sum / (total > 0 ? total : spent)) * 100
            return (
              <motion.div
                key={cat}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: idx * 0.08 }}
                style={{
                  height: '100%',
                  background: CAT_COLORS[cat],
                  cursor: 'pointer',
                  opacity: hovered && hovered !== cat ? 0.45 : 1,
                  transition: 'opacity 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={() => setHovered(cat)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })}
          {/* Over-budget overflow — ROSE with pulse */}
          {overBudget && total > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((spent - total) / total) * 100}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.7 }}
              style={{ height: '100%', background: ROSE, flexShrink: 0 }}
            >
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ width: '100%', height: '100%', background: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)` }}
              />
            </motion.div>
          )}
        </div>

        {/* Budget limit marker */}
        {total > 0 && spent <= total * 1.5 && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: `${(total / Math.max(spent, total)) * 100}%`,
            width: 2, background: 'rgba(0,0,0,0.25)', transform: 'translateX(-50%)',
          }} />
        )}
      </div>

      {/* Hover tooltip */}
      <div style={{ minHeight: 20, marginBottom: 10 }}>
        {hoveredItem && (
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 12, fontFamily: FONT_BODY, color: CAT_COLORS[hoveredItem.cat], fontWeight: 600 }}
          >
            {hoveredItem.cat}: £{hoveredItem.sum.toFixed(2)}
            {total > 0 && (
              <span style={{ color: MUTED, fontWeight: 400 }}>
                {' '}· {Math.round((hoveredItem.sum / total) * 100)}% of budget
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px' }}>
        {byCategory.map(({ cat, sum }) => (
          <div
            key={cat}
            style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', opacity: hovered && hovered !== cat ? 0.45 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(cat)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[cat], flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontFamily: FONT_BODY, color: MUTED }}>
              {cat} · £{sum.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
