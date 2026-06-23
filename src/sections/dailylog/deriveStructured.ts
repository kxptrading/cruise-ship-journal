// ─────────────────────────────────────────────────────────────────────────────
// sections/dailylog/deriveStructured.ts — Canvas → structured daily_logs fields
//
// The scrapbook canvas is the source of truth for free text, but the dashboard,
// metrics, and PDF export read the structured columns. So on every save we fold the
// canvas notes back into those columns: a note tagged with a `field` writes to that
// column; untagged notes are concatenated into `highlights` (which the "Days Logged"
// metric and the export both key off). Pure + unit-tested.
// ─────────────────────────────────────────────────────────────────────────────

import type { CanvasItem, WriteThroughField } from './canvasTypes'

// Columns we derive from the canvas. weather/rating come from the header, not here.
type Derived = Pick<
  import('../../types').DailyLog,
  'highlights' | 'bestMoment' | 'breakfast' | 'lunch' | 'dinner' | 'drink' | 'activity' | 'entertainment'
>

const FIELDS: WriteThroughField[] = [
  'highlights', 'bestMoment', 'breakfast', 'lunch', 'dinner', 'drink', 'activity', 'entertainment',
]

export function deriveStructured(canvas: CanvasItem[]): Derived {
  const buckets: Record<WriteThroughField, string[]> = {
    highlights: [], bestMoment: [], breakfast: [], lunch: [], dinner: [], drink: [], activity: [], entertainment: [],
  }

  for (const item of canvas) {
    if (item.type !== 'note') continue
    const text = (item.text ?? '').trim()
    if (!text) continue
    // Untagged notes fold into highlights so the day still registers downstream.
    const field: WriteThroughField = item.field ?? 'highlights'
    buckets[field].push(text)
  }

  const out = {} as Derived
  for (const f of FIELDS) out[f] = buckets[f].join('\n\n')
  return out
}
