# Cruise Ship Log — Project Context

## What This Is

A web-based cruise travel journal that digitises a 14-page PDF paperback journal into a full-stack
application. Think Facebook-style feed meets travel diary — users can log every day of a cruise,
track food, budget, itinerary, packing, and highlights, with the end goal of a shareable,
multi-voyage journal platform.

This is the developer's first serious production project. Decisions should prioritise clarity,
good patterns, and learning value over clever abstraction.

---

## Current State

**Phase 2 — Production (live)**

The app is fully deployed and in active use at cruise-ship-journal.vercel.app.
The prototype phase is complete. All decisions are for the production codebase.

### Production Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 6 (SPA, no SSR) |
| Language | JavaScript (JSX) — TypeScript is on the roadmap |
| Styling | CSS-in-JS inline styles + CSS variables for theming |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage (`daily-photos` bucket, signed URLs) |
| Hosting | Vercel (auto-deploy on push to `main`) |

### Architecture

```
src/
  App.jsx                   — layout shell, auth, routing (~220 lines)
  hooks/useVoyageData.js    — all Supabase data loading + write-through
  lib/converters.js         — pure DB ↔ app shape converters (22 functions)
  lib/photoStorage.js       — signed URL photo upload/fetch
  sections/
    Feed.jsx                — feed orchestrator
    feed/PostCard.jsx       — post card, reactions, comments
    feed/VoyageHero.jsx     — hero banner
    feed/QuickComposer.jsx  — quick post composer
    Chat.jsx                — messaging orchestrator
    chat/ConvItem.jsx       — conversation list row
    chat/MsgBubble.jsx      — message bubble
    chat/NewChatModal.jsx   — new DM / group modal
    chat/helpers.js         — Avatar, GroupIcon, format helpers
    Friends.jsx + FriendProfile.jsx
    [12 other journal sections]
  components/
    Sidebar.jsx  TopNav.jsx  ErrorBoundary.jsx  AuthScreen.jsx
    CameraCapture.jsx
  constants.js              — design tokens (colours, breakpoints, nav)
  themes.js                 — 20 colour themes, applyTheme(), getSavedTheme()
  context.js                — WCtx, VoyageCtx, UserCtx, useW(), useVoyageId(), useUserId()
  storage.js                — localStorage db helper
```

### Key patterns
- **Data flow**: `useVoyageData` owns all Supabase reads/writes. Components call `onChange(updatedArray)` which hits `update(key, val)` in the hook.
- **Write strategy**: `itinerary` + `daily_logs` use debounced upsert on `(voyage_id, day_number)`. All other dynamic arrays use debounced delete-all + reinsert (no natural key).
- **Theme flash prevention**: `index.html` has an inline `<script>` that applies CSS vars from `localStorage` before React mounts.
- **Photos**: Signed URLs (1-hour TTL) via `lib/photoStorage.js`. Never use `getPublicUrl`.

---

## Design System

All visual decisions are locked to this palette — do not introduce new colours without discussion.

```
NAVY   #1B3A5C  — primary brand, headings, sidebar active states
NAVY2  #14293F  — sidebar background, hero panels, dark surfaces
GOLD   #C9A227  — accent, highlights, star ratings, progress fills
CREAM  #F4F1EB  — page background
WHITE  #FFFFFF  — card backgrounds
BORDER #E0DBD0  — all borders and dividers
TEXT   #1C2B3A  — body copy
MUTED  #7A8594  — labels, secondary text, placeholders
LIGHT  #F9F7F3  — alternating table rows, box backgrounds
TEAL   #0D6B55  — ports / positive metrics
ROSE   #B03060  — ratings / emotional metrics
PLUM   #4A3B8C  — packing / completion metrics
```

### Typography
- **Display / headings:** `Georgia, "Times New Roman", serif` — used for page titles, metric values, ship name in hero
- **Body / UI:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
- **Label style:** 11px, 700 weight, uppercase, `letterSpacing: 0.08em`, colour MUTED

### Component Patterns

**Cards** — `borderRadius: 14`, `border: 1px solid BORDER`, `padding: 22px 24px`

**Section boxes** (within cards) — navy header bar (`8px 16px` padding), LIGHT background body.
Used for grouping related fields (e.g. SHIP INFORMATION, WEATHER, MEALS & DRINKS).

**Metric cards** — coloured icon badge (top-left) + optional donut ring (top-right), large serif
value, uppercase label, muted sub-text, optional progress bar at bottom.

**Sidebar nav items** — icon + label, gold left border + gold text when active,
`rgba(201,162,39,0.1)` background when active.

**Buttons (primary)** — `background: NAVY`, white text, `borderRadius: 8`, `fontWeight: 600`

**Star ratings** — gold `★` filled, BORDER `★` empty, fontSize 22

---

## Data Architecture

### Current (prototype)
All data stored via `window.storage` with key prefix `csj-`. One key per top-level section.

```
csj-voyage      Object    Ship info, dates, companions, important numbers
csj-itinerary   Array[14] One object per day: { date, port, arrive, depart }
csj-dailyLogs   Array[14] One object per day: { date, port, weather[], highlights,
                           breakfast, lunch, dinner, drink, activity, duration,
                           excCost, excNotes, entertainment, bestMoment, rating }
csj-foodLogs    Array     { day, date, meal, port, venue, what, standout, drinks,
                            notes, rating, cost, orderAgain }
csj-diningLog          Array     { venue, date, meal, ordered, rating, notes }
csj-entertainmentLog   Array     { day, date, name, type, venue, performers, duration, rating, notes }
csj-foodFav            Object    { best, buffet, specialty, surprising, recreate, regret }
csj-budget      Object    { budget: string, items: Array<{ date, item, category, amount }> }
csj-shopping    Object    { items: Array<{ item, port, cost }> }
csj-highlights  Object    { port, meal, funny, view, friends, firstTime, moment }
csj-packing     Object    { [category]: string[] }  — checked item names per category
csj-notes       String
```

### Planned (Supabase)
Each section maps to a database table. Voyages are the top-level entity — all other records
belong to a voyage, which belongs to a user.

```
users          (managed by Supabase Auth)
voyages        id, user_id, ship_name, cruise_line, cabin, deck,
               departure_date, return_date, departure_port, total_nights,
               companion_1..4, emergency_contact, phone, guest_services,
               muster_station, dining_time, created_at
itinerary      id, voyage_id, day_number, date, port, arrive, depart
daily_logs     id, voyage_id, day_number, date, port, weather, highlights,
               breakfast, lunch, dinner, drink, activity, duration, exc_cost,
               exc_notes, entertainment, best_moment, rating
food_logs      id, voyage_id, day, date, meal_type, port, venue, what_i_had,
               standout, drinks, tasting_notes, rating, cost, order_again
dining_log     id, voyage_id, venue, date, meal, ordered, rating, notes
food_fav       id, voyage_id, best, buffet, specialty, surprising, recreate, regret
budget         id, voyage_id, total_budget
budget_items   id, budget_id, date, item, category, amount
shopping_items id, voyage_id, item, port, cost
highlights     id, voyage_id, port, meal, funny, view, friends, first_time, moment
packing_items  id, voyage_id, category, item, checked
notes          id, voyage_id, content
photos         id, voyage_id, day_number, storage_path, caption, created_at
```

---

## Journal Sections (13 total)

| ID | Label | Source PDF | Status |
|---|---|---|---|
| dashboard | Dashboard | — | Built — hero, 6 metrics, timeline, budget breakdown |
| voyage | Voyage Details | `02_voyage_details.pdf` | Built |
| itinerary | Itinerary | `04_itinerary_overview.pdf` | Built |
| daily | Daily Log | `05_daily_log_page_a.pdf` + `06_daily_log_page_b.pdf` | Built |
| food | Food Log | `07_food_log.pdf` + `07_food_log_b.pdf` | Built |
| dining | Restaurant Log | `10_dining_log.pdf` | Built |
| entertainment | Entertainment Log | — | Built |
| foodfav | Food Favourites | `08_food_favourites.pdf` | Built |
| budget | Budget Tracker | `09_budget_tracker.pdf` | Built |
| shopping | Shopping Log | `11_souvenirs_shopping.pdf` | Built |
| highlights | Highlights | `12_cruise_highlights.pdf` | Built |
| packing | Packing List | `03_packing_checklist.pdf` | Built |
| notes | Notes | `13_notes.pdf` | Built |

---

## Dashboard Metrics Explained

The dashboard pulls live from all data sources and shows:

| Metric | Source | Notes |
|---|---|---|
| Days Logged | `dailyLogs` | Counts entries with `highlights` or `bestMoment` filled |
| Ports Planned | `itinerary` | Counts non-empty, non "at sea" port entries |
| Dining Entries | `foodLogs` + `diningLog` | Combined count, unique venues shown as sub-text |
| Total Spent | `budget.items` | Sum of all amounts; donut ring = % of budget used; turns red >100% |
| Items Packed | `packing` | Checked items out of fixed total of 24 |
| Avg Day Rating | `dailyLogs` | Average of all days where `rating > 0` |

The hero voyager progress bar and day counter ring are calculated from `voyage.departureDate`
vs `new Date()` — they are live and contextual to the actual sailing date.

---

## SVG Icons

Custom icon paths stored in the `IC` object. All rendered via the `SvgIcon` component.
Uses `stroke` not `fill`. Stroke width 2, linecap round, linejoin round.

```
IC.calendar  IC.mapPin  IC.fork    IC.wallet  IC.check
IC.star      IC.anchor  IC.compass IC.trending IC.food  IC.ship
```

---

## Roadmap (Next Steps)

### Immediate
- [ ] User accounts & login (Supabase Auth)
- [ ] Multiple voyages — switch between past / future cruises
- [ ] Mobile responsive layout — collapsible sidebar, touch-friendly

### Near-term
- [ ] Photo uploads — real images in Daily Log photo memory slots
- [ ] Export to PDF — recreate the physical journal format digitally
- [ ] Social sharing — shareable public highlight pages (like a Facebook post)

### Future
- [ ] AI assistant — port suggestions, excursion tips based on logged preferences
- [ ] Weather integration — auto-fill weather from departure date + port
- [ ] Packing list customisation — add/remove items, create custom categories
- [ ] Multi-user voyages — share a journal with travel companions
- [ ] Offline support — PWA with sync when reconnected

---

## File Reference

```
cruise_journal.jsx   — complete prototype (single file, all 12 sections)
CLAUDE.md            — this file
```

Source PDFs in `/mnt/project/`:
```
01_title_page.pdf
02_voyage_details.pdf
03_packing_checklist.pdf
04_itinerary_overview.pdf
05_daily_log_page_a.pdf
06_daily_log_page_b.pdf
07_food_log.pdf
07_food_log_b.pdf
08_food_favourites.pdf
09_budget_tracker.pdf
10_dining_log.pdf
11_souvenirs_shopping.pdf
12_cruise_highlights.pdf
13_notes.pdf
14_back_cover.pdf
```

---

## Conventions

- Currency is GBP (£) throughout. Format: `£{amount.toFixed(2)}` for totals, `£{amount.toFixed(0)}` for rounded display.
- Dates: stored as ISO strings (`YYYY-MM-DD`), displayed as entered by user.
- All arrays are initialised to empty `[]`, not null.
- `dailyLogs` and `itinerary` are always exactly 14 entries (index = day - 1).
- Budget overspend is flagged visually at >100% (red donut, red metric colour).
- Packing progress warning threshold: none — green only at 100%.
- Do not add new sections without updating NAV array, INIT state, the root App renderer, and this file.
