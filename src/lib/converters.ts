// ─────────────────────────────────────────────────────────────────────────────
// lib/converters.ts — Pure DB ↔ app shape converters
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Voyage, ItineraryDay, DailyLog, FoodLog, DiningEntry, EntertainmentEntry,
  FoodFavourites, Highlights, Budget, BudgetItem, Shopping, ShoppingItem,
  Packing, Note,
} from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Inline DB row types — one per domain. These reflect the actual Postgres
// column names and nullable types. They are not exported (consumers use the
// app-level types from types.ts).
// ─────────────────────────────────────────────────────────────────────────────

interface VoyageRow {
  ship_name?:         string | null
  cruise_line?:       string | null
  cabin?:             string | null
  deck?:              string | null
  departure_date?:    string | null
  return_date?:       string | null
  departure_port?:    string | null
  total_nights?:      number | null
  companion_1?:       string | null
  companion_2?:       string | null
  companion_3?:       string | null
  companion_4?:       string | null
  emergency_contact?: string | null
  phone?:             string | null
  guest_services?:    string | null
  muster_station?:    string | null
  dining_time?:          string | null
  cover_photo_url?:      string | null
  cruise_description?:   string | null
}

interface ItineraryRow {
  day_number: number
  date?:      string | null
  port?:      string | null
  arrive?:    string | null
  depart?:    string | null
}

interface DailyLogRow {
  day_number?:    number
  date?:          string | null
  port?:          string | null
  weather?:       string[] | null
  highlights?:    string | null
  breakfast?:     string | null
  lunch?:         string | null
  dinner?:        string | null
  drink?:         string | null
  activity?:      string | null
  duration?:      string | null
  exc_cost?:      string | null
  exc_notes?:     string | null
  entertainment?: string | null
  best_moment?:   string | null
  rating?:        number | null
  is_public?:     boolean | null
}

interface FoodLogRow {
  id?:            string | null
  day?:           string | number | null
  date?:          string | null
  meal_type?:     string | null
  port?:          string | null
  venue?:         string | null
  what_i_had?:    string | null
  standout?:      string | null
  drinks?:        string | null
  tasting_notes?: string | null
  rating?:        number | null
  cost?:          string | null
  order_again?:   string | null
  photos?:        string[] | null
}

interface DiningLogRow {
  id?:      string | null
  venue?:   string | null
  date?:    string | null
  meal?:    string | null
  ordered?: string | null
  rating?:  number | null
  notes?:   string | null
}

interface EntertainmentRow {
  id?:         string | null
  day?:        number | null
  date?:       string | null
  name?:       string | null
  type?:       string | null
  venue?:      string | null
  performers?: string | null
  duration?:   string | null
  rating?:     number | null
  notes?:      string | null
}

interface FoodFavRow {
  best?:       string | null
  buffet?:     string | null
  specialty?:  string | null
  surprising?: string | null
  recreate?:   string | null
  regret?:     string | null
}

interface HighlightsRow {
  port?:       string | null
  meal?:       string | null
  funny?:      string | null
  view?:       string | null
  friends?:    string | null
  first_time?: string | null
  moment?:     string | null
}

interface BudgetRow {
  total_budget?: number | string | null
}

interface BudgetItemRow {
  id?:       string | null
  date?:     string | null
  item?:     string | null
  category?: string | null
  amount?:   number | null
}

interface ShoppingRow {
  id?:   string | null
  item?: string | null
  port?: string | null
  cost?: number | null
}

interface PackingRow {
  category?: string | null
  item?:     string | null
  checked?:  boolean | null
}

interface NoteRow {
  id?:      string | null
  title?:   string | null
  content?: string | null
}


// ── Voyage ────────────────────────────────────────────────────────────────────

export function fromDbVoyage(row: VoyageRow): Voyage {
  return {
    shipName:         row.ship_name         ?? '',
    cruiseLine:       row.cruise_line       ?? '',
    cabin:            row.cabin             ?? '',
    deck:             row.deck              ?? '',
    departureDate:    row.departure_date    ?? '',
    returnDate:       row.return_date       ?? '',
    departurePort:    row.departure_port    ?? '',
    totalNights:      row.total_nights != null ? String(row.total_nights) : '',
    companion1:       row.companion_1       ?? '',
    companion2:       row.companion_2       ?? '',
    companion3:       row.companion_3       ?? '',
    companion4:       row.companion_4       ?? '',
    emergencyContact: row.emergency_contact ?? '',
    phone:            row.phone             ?? '',
    guestServices:    row.guest_services    ?? '',
    musterStation:    row.muster_station    ?? '',
    diningTime:          row.dining_time          ?? '',
    coverPhotoUrl:       row.cover_photo_url      ?? '',
    cruiseDescription:   row.cruise_description   ?? '',
  }
}

export function toDbVoyage(v: Voyage) {
  return {
    ship_name:         v.shipName         || null,
    cruise_line:       v.cruiseLine       || null,
    cabin:             v.cabin            || null,
    deck:              v.deck             || null,
    departure_date:    v.departureDate    || null,
    return_date:       v.returnDate       || null,
    departure_port:    v.departurePort    || null,
    total_nights:      v.totalNights ? parseInt(v.totalNights, 10) : null,
    companion_1:       v.companion1       || null,
    companion_2:       v.companion2       || null,
    companion_3:       v.companion3       || null,
    companion_4:       v.companion4       || null,
    emergency_contact: v.emergencyContact || null,
    phone:             v.phone            || null,
    guest_services:    v.guestServices    || null,
    muster_station:    v.musterStation    || null,
    dining_time:          v.diningTime          || null,
    cover_photo_url:      v.coverPhotoUrl       || null,
    cruise_description:   v.cruiseDescription   || null,
  }
}


// ── Itinerary ─────────────────────────────────────────────────────────────────

export function fromDbItinerary(rows: ItineraryRow[]): ItineraryDay[] {
  return [...rows]
    .sort((a, b) => a.day_number - b.day_number)
    .map(row => ({
      date:   row.date                              ?? '',
      port:   row.port                              ?? '',
      arrive: row.arrive ? row.arrive.slice(0, 5) : '',
      depart: row.depart ? row.depart.slice(0, 5) : '',
    }))
}

export function toDbItinerary(voyageId: string, arr: ItineraryDay[]) {
  return arr.map((day, i) => ({
    voyage_id:  voyageId,
    day_number: i + 1,
    date:       day.date   || null,
    port:       day.port   || null,
    arrive:     day.arrive || null,
    depart:     day.depart || null,
  }))
}


// ── Daily Logs ────────────────────────────────────────────────────────────────

export function fromDbDailyLogs(rows: DailyLogRow[]): DailyLog[] {
  return [...rows]
    .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
    .map(row => ({
      date:          row.date          ?? '',
      port:          row.port          ?? '',
      weather:       row.weather       ?? [],
      highlights:    row.highlights    ?? '',
      breakfast:     row.breakfast     ?? '',
      lunch:         row.lunch         ?? '',
      dinner:        row.dinner        ?? '',
      drink:         row.drink         ?? '',
      activity:      row.activity      ?? '',
      duration:      row.duration      ?? '',
      excCost:       row.exc_cost      ?? '',
      excNotes:      row.exc_notes     ?? '',
      entertainment: row.entertainment ?? '',
      bestMoment:    row.best_moment   ?? '',
      rating:        row.rating        ?? 0,
      isPublic:      row.is_public     ?? false,
    }))
}

export function toDbDailyLogs(voyageId: string, arr: DailyLog[]) {
  return arr.map((day, i) => ({
    voyage_id:     voyageId,
    day_number:    i + 1,
    date:          day.date          || null,
    port:          day.port          || null,
    weather:       day.weather       || [],
    highlights:    day.highlights    || null,
    breakfast:     day.breakfast     || null,
    lunch:         day.lunch         || null,
    dinner:        day.dinner        || null,
    drink:         day.drink         || null,
    activity:      day.activity      || null,
    duration:      day.duration      || null,
    exc_cost:      day.excCost       || null,
    exc_notes:     day.excNotes      || null,
    entertainment: day.entertainment || null,
    best_moment:   day.bestMoment    || null,
    rating:        day.rating        || null,
    is_public:     day.isPublic      ?? false,
  }))
}


// ── Food Logs ─────────────────────────────────────────────────────────────────

export function fromDbFoodLogs(rows: FoodLogRow[]): FoodLog[] {
  return rows.map(r => ({
    id:         r.id            ?? crypto.randomUUID(),
    day:        r.day != null ? String(r.day) : '',
    date:       r.date          ?? '',
    meal:       r.meal_type     ?? '',
    port:       r.port          ?? '',
    venue:      r.venue         ?? '',
    what:       r.what_i_had    ?? '',
    standout:   r.standout      ?? '',
    drinks:     r.drinks        ?? '',
    notes:      r.tasting_notes ?? '',
    rating:     r.rating        ?? 0,
    cost:       r.cost          ?? '',
    orderAgain: r.order_again   ?? '',
    photos:     (r.photos as string[] | null) ?? [],
  }))
}

export function toDbFoodLogs(voyageId: string, arr: FoodLog[]) {
  return arr.map(m => ({
    id:            m.id,
    voyage_id:     voyageId,
    day:           m.day        || null,
    date:          m.date       || null,
    meal_type:     m.meal       || null,
    port:          m.port       || null,
    venue:         m.venue      || null,
    what_i_had:    m.what       || null,
    standout:      m.standout   || null,
    drinks:        m.drinks     || null,
    tasting_notes: m.notes      || null,
    rating:        m.rating     || null,
    cost:          m.cost       || null,
    order_again:   m.orderAgain || null,
    photos:        m.photos?.length ? m.photos : [],
  }))
}


// ── Dining Log ────────────────────────────────────────────────────────────────

export function fromDbDiningLog(rows: DiningLogRow[]): DiningEntry[] {
  return rows.map(r => ({
    id:      r.id      ?? crypto.randomUUID(),
    venue:   r.venue   ?? '',
    date:    r.date    ?? '',
    meal:    r.meal    ?? '',
    ordered: r.ordered ?? '',
    rating:  r.rating  ?? 0,
    notes:   r.notes   ?? '',
  }))
}

export function toDbDiningLog(voyageId: string, arr: DiningEntry[]) {
  return arr.map(r => ({
    id:        r.id,
    voyage_id: voyageId,
    venue:     r.venue   || null,
    date:      r.date    || null,
    meal:      r.meal    || null,
    ordered:   r.ordered || null,
    rating:    r.rating  || null,
    notes:     r.notes   || null,
  }))
}


// ── Entertainment Log ─────────────────────────────────────────────────────────

export function fromDbEntertainmentLog(rows: EntertainmentRow[]): EntertainmentEntry[] {
  return rows.map(r => ({
    id:         r.id          ?? crypto.randomUUID(),
    day:        r.day != null ? String(r.day) : '',
    date:       r.date        ?? '',
    name:       r.name        ?? '',
    type:       r.type        ?? '',
    venue:      r.venue       ?? '',
    performers: r.performers  ?? '',
    duration:   r.duration    ?? '',
    rating:     r.rating      ?? 0,
    notes:      r.notes       ?? '',
  }))
}

export function toDbEntertainmentLog(voyageId: string, arr: EntertainmentEntry[]) {
  return arr.map(e => ({
    id:         e.id,
    voyage_id:  voyageId,
    day:        e.day ? parseInt(e.day, 10) : null,
    date:       e.date        || null,
    name:       e.name        || null,
    type:       e.type        || null,
    venue:      e.venue       || null,
    performers: e.performers  || null,
    duration:   e.duration    || null,
    rating:     e.rating      || null,
    notes:      e.notes       || null,
  }))
}


// ── Food Favourites ───────────────────────────────────────────────────────────

export function fromDbFoodFav(row: FoodFavRow | null | undefined): Partial<FoodFavourites> {
  if (!row) return {}
  return {
    best:       row.best       ?? '',
    buffet:     row.buffet     ?? '',
    specialty:  row.specialty  ?? '',
    surprising: row.surprising ?? '',
    recreate:   row.recreate   ?? '',
    regret:     row.regret     ?? '',
  }
}

export function toDbFoodFav(voyageId: string, v: Partial<FoodFavourites>) {
  return {
    voyage_id:  voyageId,
    best:       v.best       || null,
    buffet:     v.buffet     || null,
    specialty:  v.specialty  || null,
    surprising: v.surprising || null,
    recreate:   v.recreate   || null,
    regret:     v.regret     || null,
  }
}


// ── Highlights ────────────────────────────────────────────────────────────────

export function fromDbHighlights(row: HighlightsRow | null | undefined): Partial<Highlights> {
  if (!row) return {}
  return {
    port:      row.port       ?? '',
    meal:      row.meal       ?? '',
    funny:     row.funny      ?? '',
    view:      row.view       ?? '',
    friends:   row.friends    ?? '',
    firstTime: row.first_time ?? '',
    moment:    row.moment     ?? '',
  }
}

export function toDbHighlights(voyageId: string, v: Partial<Highlights>) {
  return {
    voyage_id:  voyageId,
    port:       v.port      || null,
    meal:       v.meal      || null,
    funny:      v.funny     || null,
    view:       v.view      || null,
    friends:    v.friends   || null,
    first_time: v.firstTime || null,
    moment:     v.moment    || null,
  }
}


// ── Budget ────────────────────────────────────────────────────────────────────

export function fromDbBudget(budgetRow: BudgetRow | null | undefined, itemRows: BudgetItemRow[]): Budget {
  return {
    budget: budgetRow?.total_budget ?? '',
    items:  (itemRows || []).map((r): BudgetItem => ({
      id:       r.id       ?? crypto.randomUUID(),
      date:     r.date     ?? '',
      item:     r.item     ?? '',
      category: r.category ?? '',
      amount:   r.amount != null ? String(r.amount) : '',
    })),
  }
}


// ── Shopping ──────────────────────────────────────────────────────────────────

export function fromDbShopping(rows: ShoppingRow[]): Shopping {
  return {
    items: rows.map((r): ShoppingItem => ({
      id:   r.id   ?? crypto.randomUUID(),
      item: r.item ?? '',
      port: r.port ?? '',
      cost: r.cost != null ? String(r.cost) : '',
    })),
  }
}

export function toDbShoppingItems(voyageId: string, arr: ShoppingItem[]) {
  return arr.map(i => ({
    id:        i.id,
    voyage_id: voyageId,
    item:      i.item || null,
    port:      i.port || null,
    cost:      i.cost ? parseFloat(i.cost) : null,
  }))
}


// ── Packing ───────────────────────────────────────────────────────────────────

export function fromDbPacking(rows: PackingRow[]): Packing {
  const result: Packing = {}
  rows.filter(r => r.checked).forEach(r => {
    const cat = r.category ?? ''
    if (!result[cat]) result[cat] = []
    result[cat].push(r.item ?? '')
  })
  return result
}

export function toDbPackingItems(voyageId: string, obj: Packing) {
  return Object.entries(obj).flatMap(([cat, items]) =>
    items.map(item => ({ voyage_id: voyageId, category: cat, item, checked: true }))
  )
}


// ── Notes ─────────────────────────────────────────────────────────────────────

export function fromDbNotes(rows: NoteRow[]): Note[] {
  return rows.map(r => ({
    id:      r.id      ?? crypto.randomUUID(),
    title:   r.title   ?? '',
    content: r.content ?? '',
  }))
}

export function toDbNotes(voyageId: string, arr: Note[]) {
  return arr.map(n => ({
    id:        n.id,
    voyage_id: voyageId,
    title:     n.title   || null,
    content:   n.content || null,
  }))
}
