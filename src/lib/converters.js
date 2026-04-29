// ─────────────────────────────────────────────────────────────────────────────
// lib/converters.js — Pure DB ↔ app shape converters
//
// Each pair of functions translates between Supabase snake_case row shapes and
// the camelCase objects the React components work with. All functions are pure
// (no side-effects, no imports) so they're trivial to unit-test.
//
// Naming convention:
//   fromDb*(row | rows)         → app shape
//   toDb*(voyageId, appVal)     → DB row / rows ready for insert/upsert
// ─────────────────────────────────────────────────────────────────────────────


// ── Voyage ────────────────────────────────────────────────────────────────────

export function fromDbVoyage(row) {
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
    diningTime:       row.dining_time       ?? '',
    coverPhotoUrl:    row.cover_photo_url   ?? '',
  }
}

export function toDbVoyage(v) {
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
    dining_time:       v.diningTime       || null,
    cover_photo_url:   v.coverPhotoUrl    || null,
  }
}


// ── Itinerary ─────────────────────────────────────────────────────────────────
// arrive/depart come back from Postgres as HH:MM:SS — slice to HH:MM to match
// <input type="time">.

export function fromDbItinerary(rows) {
  return [...rows]
    .sort((a, b) => a.day_number - b.day_number)
    .map(row => ({
      date:   row.date                              ?? '',
      port:   row.port                              ?? '',
      arrive: row.arrive ? row.arrive.slice(0, 5) : '',
      depart: row.depart ? row.depart.slice(0, 5) : '',
    }))
}

export function toDbItinerary(voyageId, arr) {
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
// exc_cost/exc_notes/best_moment are the DB column names;
// excCost/excNotes/bestMoment are the camelCase app names.

export function fromDbDailyLogs(rows) {
  return [...rows]
    .sort((a, b) => a.day_number - b.day_number)
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

export function toDbDailyLogs(voyageId, arr) {
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
// DB uses meal_type / what_i_had / tasting_notes / order_again;
// app uses meal / what / notes / orderAgain.

export function fromDbFoodLogs(rows) {
  return rows.map(r => ({
    day:        r.day           ?? '',
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
  }))
}

export function toDbFoodLogs(voyageId, arr) {
  return arr.map(m => ({
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
  }))
}


// ── Dining Log ────────────────────────────────────────────────────────────────
// Column names match app field names exactly — no renaming needed.

export function fromDbDiningLog(rows) {
  return rows.map(r => ({
    venue:   r.venue   ?? '',
    date:    r.date    ?? '',
    meal:    r.meal    ?? '',
    ordered: r.ordered ?? '',
    rating:  r.rating  ?? 0,
    notes:   r.notes   ?? '',
  }))
}

export function toDbDiningLog(voyageId, arr) {
  return arr.map(r => ({
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
// day is stored as integer in DB; app treats it as a string.

export function fromDbEntertainmentLog(rows) {
  return rows.map(r => ({
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

export function toDbEntertainmentLog(voyageId, arr) {
  return arr.map(e => ({
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
// Single record per voyage. Direct 1-to-1 column mapping.

export function fromDbFoodFav(row) {
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

export function toDbFoodFav(voyageId, v) {
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
// Single record per voyage. firstTime ↔ first_time.

export function fromDbHighlights(row) {
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

export function toDbHighlights(voyageId, v) {
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
// budget row (total_budget) + budget_items array.
// amount is numeric in DB; stored as string in app for input binding.

export function fromDbBudget(budgetRow, itemRows) {
  return {
    budget: budgetRow?.total_budget ?? '',
    items:  (itemRows || []).map(r => ({
      date:     r.date     ?? '',
      item:     r.item     ?? '',
      category: r.category ?? '',
      amount:   r.amount != null ? String(r.amount) : '',
    })),
  }
}


// ── Shopping ──────────────────────────────────────────────────────────────────
// Wrapped { items: [] } shape. cost is numeric in DB.

export function fromDbShopping(rows) {
  return {
    items: rows.map(r => ({
      item: r.item ?? '',
      port: r.port ?? '',
      cost: r.cost != null ? String(r.cost) : '',
    })),
  }
}

export function toDbShoppingItems(voyageId, arr) {
  return arr.map(i => ({
    voyage_id: voyageId,
    item:      i.item || null,
    port:      i.port || null,
    cost:      i.cost ? parseFloat(i.cost) : null,
  }))
}


// ── Packing ───────────────────────────────────────────────────────────────────
// { [category]: string[] } of checked item names.
// DB stores one row per checked item; unchecked items are hardcoded in the UI.

export function fromDbPacking(rows) {
  const result = {}
  rows.filter(r => r.checked).forEach(r => {
    if (!result[r.category]) result[r.category] = []
    result[r.category].push(r.item)
  })
  return result
}

export function toDbPackingItems(voyageId, obj) {
  return Object.entries(obj).flatMap(([cat, items]) =>
    items.map(item => ({ voyage_id: voyageId, category: cat, item, checked: true }))
  )
}


// ── Notes ─────────────────────────────────────────────────────────────────────
// Dynamic array of { title, content } objects.

export function fromDbNotes(rows) {
  return rows.map(r => ({ title: r.title ?? '', content: r.content ?? '' }))
}

export function toDbNotes(voyageId, arr) {
  return arr.map(n => ({
    voyage_id: voyageId,
    title:     n.title   || null,
    content:   n.content || null,
  }))
}
