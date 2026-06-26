// ─────────────────────────────────────────────────────────────────────────────
// types.ts — Shared app-level TypeScript types
//
// These mirror the camelCase shapes used by React components (not DB rows).
// DB shapes live in lib/converters.js — keep converters in sync with these.
//
// Import in JSX files with:
//   /** @type {import('./types').VoyageData} */
// or gradually rename files to .tsx/.ts as the codebase evolves.
// ─────────────────────────────────────────────────────────────────────────────

// ── Voyage ────────────────────────────────────────────────────────────────────

export interface Voyage {
  shipName:         string
  cruiseLine:       string
  cabin:            string
  deck:             string
  departureDate:    string   // ISO date string YYYY-MM-DD
  returnDate:       string
  departurePort:    string
  totalNights:      string   // stored as string for <input> binding, parsed on write
  companion1:       string
  companion2:       string
  companion3:       string
  companion4:       string
  emergencyContact: string
  phone:            string
  guestServices:    string
  musterStation:    string
  diningTime:       string
  breakfastTime:    string
  lunchTime:        string
  roomLocation:     string   // nautical: Fore | Midship | Aft
  safeboxPin:       string
  coverPhotoUrl:       string
  destination:         string   // where the ship is going, e.g. "Norwegian Fjords"
  cruiseDescription:   string   // free-text description of the cruise
}

// ── Itinerary ─────────────────────────────────────────────────────────────────

export interface ItineraryDay {
  date:   string   // YYYY-MM-DD
  port:   string
  arrive: string   // HH:MM
  depart: string   // HH:MM
}

// ── Daily Log ─────────────────────────────────────────────────────────────────

export interface DailyLog {
  date:          string
  port:          string
  weather:       string[]
  highlights:    string
  breakfast:     string
  lunch:         string
  dinner:        string
  drink:         string
  activity:      string
  duration:      string
  excCost:       string
  excNotes:      string
  entertainment: string
  bestMoment:    string
  rating:        number    // 0–5
  isPublic:      boolean
  canvas?:       import('./sections/dailylog/canvasTypes').CanvasItem[]  // scrapbook layer
}

// ── Food Log ──────────────────────────────────────────────────────────────────

export interface FoodLog {
  id:         string
  day:        string
  date:       string
  meal:       string
  port:       string
  venue:      string
  what:       string
  standout:   string
  drinks:     string
  notes:      string
  rating:     number
  cost:       string
  orderAgain: string
  photos:     string[]   // storage paths in daily-photos bucket
}

// ── Dining Log ────────────────────────────────────────────────────────────────

export interface DiningEntry {
  id:      string
  venue:   string
  date:    string
  meal:    string
  ordered: string
  rating:  number
  notes:   string
}

// ── Entertainment Log ─────────────────────────────────────────────────────────

export interface EntertainmentEntry {
  id:         string
  day:        string   // stored as string for <input> binding
  date:       string
  name:       string
  type:       string
  venue:      string
  performers: string
  duration:   string
  rating:     number
  notes:      string
}

// ── Food Favourites ───────────────────────────────────────────────────────────

export interface FoodFavourites {
  best:       string
  buffet:     string
  specialty:  string
  surprising: string
  recreate:   string
  regret:     string
}

// ── Highlights ────────────────────────────────────────────────────────────────

export interface Highlights {
  port:      string
  meal:      string
  funny:     string
  view:      string
  friends:   string
  firstTime: string
  moment:    string
}

// ── Budget ────────────────────────────────────────────────────────────────────

export interface BudgetItem {
  id:       string
  date:     string
  item:     string
  category: string
  amount:   string   // string for <input> binding, parsed to float on write
}

export interface Budget {
  budget: string | number   // '' when unset, number from DB
  items:  BudgetItem[]
}

// ── Shopping ──────────────────────────────────────────────────────────────────

export interface ShoppingItem {
  id:   string
  item: string
  port: string
  cost: string   // string for <input> binding
}

export interface Shopping {
  items: ShoppingItem[]
}

// ── Packing ───────────────────────────────────────────────────────────────────

/** Keys are category names; values are arrays of checked item names. */
export type Packing = Record<string, string[]>

// ── Notes ─────────────────────────────────────────────────────────────────────

export interface Note {
  id:      string
  title:   string
  content: string
  xPct?:     number   // board position: 0–1 fraction of board width
  y?:        number   // board position: px from top
  color?:    string   // sticky-paper colour
  photoPath?: string  // storage path when this sticky is a photo (not in the photos table)
}

// ── Aggregated voyage data (shape returned by useVoyageData) ──────────────────

export interface VoyageData {
  voyage:           Voyage
  itinerary:        ItineraryDay[]
  dailyLogs:        DailyLog[]
  foodLogs:         FoodLog[]
  diningLog:        DiningEntry[]
  entertainmentLog: EntertainmentEntry[]
  foodFav:          Partial<FoodFavourites>
  budget:           Budget
  shopping:         Shopping
  highlights:       Partial<Highlights>
  packing:          Packing
  notes:            Note[]
}

// ── Supabase voyage row (list view — partial columns) ─────────────────────────

export interface VoyageListRow {
  id:              string
  ship_name:       string | null
  cruise_line:     string | null
  departure_date:  string | null
  return_date:     string | null
  total_nights:    number | null
  cover_photo_url: string | null
}

// ── Feed / social ─────────────────────────────────────────────────────────────

export interface FeedAuthor {
  userId?:   string
  name:      string
  avatarUrl: string
  initials:  string
  shipName:  string
}

export interface FeedPhoto {
  dataUrl: string
  caption: string
}

export interface FeedItem extends Omit<DailyLog, 'isPublic'> {
  dayIndex:     number
  dayNumber:    number
  voyageId:     string
  resolvedPort: string
  photo:        FeedPhoto | null
  author:       FeedAuthor | null   // null = own post
}

export interface ReactionState {
  count: number
  mine:  boolean
}

/** keyed by `${voyageId}-${dayNumber}` */
export type ReactionsMap = Record<string, Record<string, ReactionState>>

export interface Comment {
  id:             string
  user_id:        string
  body:           string
  created_at:     string
  authorName:     string
  authorAvatar:   string
  authorInitials: string
}

/** keyed by `${voyageId}-${dayNumber}` */
export type CommentsMap = Record<string, Comment[]>

// ── useVoyageData hook ────────────────────────────────────────────────────────

/** Fully-empty Voyage — used as the INIT value before data loads. */
export const EMPTY_VOYAGE: Voyage = {
  shipName: '', cruiseLine: '', cabin: '', deck: '',
  departureDate: '', returnDate: '', departurePort: '', totalNights: '',
  companion1: '', companion2: '', companion3: '', companion4: '',
  emergencyContact: '', phone: '', guestServices: '', musterStation: '',
  diningTime: '', breakfastTime: '', lunchTime: '', roomLocation: '', safeboxPin: '',
  coverPhotoUrl: '', destination: '', cruiseDescription: '',
}

export interface UseVoyageDataReturn {
  data:                 VoyageData
  loaded:               boolean
  voyageId:             string | null
  allVoyages:           VoyageListRow[]
  update:               (key: keyof VoyageData, val: VoyageData[keyof VoyageData]) => void
  switchVoyage:         (newId: string) => void
  createVoyage:         (userId: string, partial?: Record<string, unknown>) => Promise<VoyageListRow | null>
  handleCoverPhotoChange: (url: string | null) => void
}

// ── Photo record (Supabase Storage + photos table) ────────────────────────────

export interface PhotoRecord {
  id:           string
  storage_path: string
  caption:      string
  created_at:   string
  dataUrl:      string
}
