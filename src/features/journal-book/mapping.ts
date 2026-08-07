// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/mapping.ts — turn voyage data into a Book model
//
// Pure functions (no I/O) so they can be unit-tested and reused. The hook
// (hooks.ts) fetches the voyage row, its daily_logs, and photos, then calls
// buildBook() to produce the model the UI renders. Everything is derived from
// what the user already logged — the book is read-only.
// ─────────────────────────────────────────────────────────────────────────────

// ── Input shapes (loose — matches the DB row columns we read) ─────────────────
export interface VoyageInput {
  id:              string
  ship_name?:      string | null
  destination?:    string | null
  cruise_line?:    string | null
  departure_date?: string | null
  return_date?:    string | null
  cover_photo_url?:string | null
}

export interface DailyLogInput {
  day_number?:  number | null
  date?:        string | null
  port?:        string | null
  weather?:     string[] | null
  rating?:      number | null
  highlights?:  string | null
  best_moment?: string | null
  activity?:    string | null
  entertainment?: string | null
  breakfast?:   string | null
  lunch?:       string | null
  dinner?:      string | null
  drink?:       string | null
}

export interface PhotoInput {
  day_number?: number | null
  url:         string   // resolved (signed) URL
  caption?:    string | null
}

// ── Output model ──────────────────────────────────────────────────────────────
export type WeatherChip = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'STORMY'

export interface BookPhoto { url: string; caption: string }

export interface ChecklistItem { label: string; value: string }

export interface BookCover {
  title:     string
  subtitle:  string
  dateRange: string
  owner:     string
  photoUrl:  string | null
}

export interface BookDay {
  dayNumber: number
  dateLabel: string        // e.g. "JUNE 3"
  location:  string        // e.g. "Rome, Italy"
  weather:   WeatherChip | null
  mood:      number        // 0–5 (0 = hide the mood row)
  story:     string        // narrative prose (may be '')
  checklist: ChecklistItem[]
  photos:    BookPhoto[]   // ≤ MAX_PHOTOS_PER_DAY
}

export interface Book {
  cover: BookCover
  days:  BookDay[]
}

export const MAX_PHOTOS_PER_DAY = 3

// ── Weather mapping ───────────────────────────────────────────────────────────
// The app's daily-log weather vocabulary → the design's four chips. weather is a
// string[]; we use the first tag. Unknown/empty → null (chip hidden).
const WEATHER_MAP: Record<string, WeatherChip> = {
  sunny: 'SUNNY', hot: 'SUNNY',
  cloudy: 'CLOUDY', mild: 'CLOUDY', cool: 'CLOUDY',
  rainy: 'RAINY',
  windy: 'STORMY', stormy: 'STORMY',
}
export function toWeatherChip(weather: string[] | null | undefined): WeatherChip | null {
  const first = (weather ?? []).find(Boolean)
  if (!first) return null
  return WEATHER_MAP[first.trim().toLowerCase()] ?? null
}

// ── Date label ("JUNE 3", uppercase) ─────────────────────────────────────────
const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
export function dateLabel(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}
function dateRange(from: string | null | undefined, to: string | null | undefined): string {
  const a = dateLabel(from), b = dateLabel(to)
  if (a && b) return `${a} – ${b}`
  return a || b || ''
}

// Join non-empty parts with a separator (trims + dedupes falsy).
const join = (parts: (string | null | undefined)[], sep = ', ') =>
  parts.map(p => (p ?? '').trim()).filter(Boolean).join(sep)

// ── Checklist (rows appear only when their source has content) ────────────────
export function buildChecklist(log: DailyLogInput): ChecklistItem[] {
  const items: ChecklistItem[] = []
  const ate = join([log.breakfast, log.lunch, log.dinner, log.drink])
  if (ate) items.push({ label: 'I ate:', value: ate })
  const saw = join([log.activity, log.entertainment])
  if (saw) items.push({ label: 'I saw:', value: saw })
  const fav = (log.best_moment ?? '').trim()
  if (fav) items.push({ label: 'Favorite moment:', value: fav })
  return items
}

// ── Story prose: prefer the derived narrative, then best moment, then activity ─
export function buildStory(log: DailyLogInput): string {
  return (log.highlights ?? '').trim()
    || (log.best_moment ?? '').trim()
    || (log.activity ?? '').trim()
    || ''
}

// A day is worth a page if it has any narrative, checklist row, or photo.
function dayHasContent(day: BookDay): boolean {
  return !!(day.story || day.checklist.length || day.photos.length)
}

// ── buildBook ─────────────────────────────────────────────────────────────────
export function buildBook(
  voyage: VoyageInput,
  logs: DailyLogInput[],
  photos: PhotoInput[],
  owner: string,
): Book {
  // Group photos by day_number, preserving input order, capped per day.
  const photosByDay = new Map<number, BookPhoto[]>()
  for (const p of photos) {
    const dn = p.day_number ?? 0
    const list = photosByDay.get(dn) ?? []
    if (list.length < MAX_PHOTOS_PER_DAY) {
      list.push({ url: p.url, caption: (p.caption ?? '').trim() })
      photosByDay.set(dn, list)
    }
  }

  const days: BookDay[] = logs
    .slice()
    .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
    .map((log): BookDay => {
      const dn = log.day_number ?? 0
      return {
        dayNumber: dn,
        dateLabel: dateLabel(log.date),
        location:  (log.port ?? '').trim(),
        weather:   toWeatherChip(log.weather),
        mood:      Math.max(0, Math.min(5, Math.round(log.rating ?? 0))),
        story:     buildStory(log),
        checklist: buildChecklist(log),
        photos:    photosByDay.get(dn) ?? [],
      }
    })
    .filter(dayHasContent)

  const cover: BookCover = {
    title:     (voyage.destination || voyage.ship_name || 'My Voyage').trim(),
    subtitle:  (voyage.cruise_line || 'wander often · write always').trim(),
    dateRange: dateRange(voyage.departure_date, voyage.return_date),
    owner:     (owner || '').trim(),
    photoUrl:  voyage.cover_photo_url || null,
  }

  return { cover, days }
}
