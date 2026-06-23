// ─────────────────────────────────────────────────────────────────────────────
// sections/dailylog/canvasTypes.ts — Scrapbook canvas data model
//
// The Daily Log's freeform canvas is a list of positioned items (sticky notes and
// photo blocks). It's stored as JSON in daily_logs.canvas (its own layer), while
// the structured daily_logs columns are kept populated via deriveStructured() so
// the dashboard, metrics, and PDF export keep working.
// ─────────────────────────────────────────────────────────────────────────────

// Structured daily_logs fields a note can write through to. Untagged notes fold
// into `highlights` so the day still registers in metrics/export.
export type WriteThroughField =
  | 'highlights' | 'bestMoment' | 'breakfast' | 'lunch' | 'dinner'
  | 'drink' | 'activity' | 'entertainment'

export interface CanvasItem {
  id:        string
  type:      'note' | 'photo'
  xPct:      number            // 0–1 fraction of canvas width (responsive)
  y:         number            // px from canvas top
  rotation?: number            // gentle tilt for the scrapbook feel
  // note
  text?:     string
  color?:    string            // sticky-paper colour
  field?:    WriteThroughField // structured column this note feeds (undefined → highlights)
  // photo
  storagePath?: string         // daily-photos bucket path
}

// Sticky-note paper colours (cream/gold palette).
export const NOTE_COLORS = ['#FFF7D6', '#FDE9E4', '#E4F0FD', '#E8F5E9', '#F3E9FD'] as const
