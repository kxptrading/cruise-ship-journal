# Deck Days — Project Context

## What This Is

A journal-first web app for documenting cruise voyages. Users keep private day-by-day journals
organised by voyage. Individual posts can be opt-in shared to a social Feed visible to contacts.
The journal is the primary surface; the Feed is secondary.

**Canonical production URL:** `https://cruise-ship-journal.vercel.app` (Vercel).

> ⚠️ **Domain note:** `deck-days.com` is the intended custom domain but is **not yet
> pointed at Vercel** — it does not resolve to production today. The UI/marketing copy
> already uses the "Deck Days" / `deck-days.com` brand, but anything that must hit the
> live app (CORS allow-lists, OAuth/Supabase redirect URLs, social-share/OG meta tags,
> canonical links, sitemaps) MUST use the `.vercel.app` URL above until the custom
> domain is live. When `deck-days.com` is connected, update this line and audit those
> call sites together.

---

## Current State

**Phases 0–8 complete. Production codebase.**

The full spec from `CRUISE_VOYAGE_JOURNAL_SPEC.md` has been implemented.

### Production Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 6 (SPA, no SSR) |
| Language | TypeScript throughout |
| Routing | React Router v7 (`<BrowserRouter>` + `<Routes>`) |
| Server state | TanStack Query v5 (React Query) — all data fetching |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) + inline styles (coexisting) |
| UI primitives | shadcn/ui scaffold in `src/components/ui/` |
| Animation | Framer Motion v12 |
| Icons | `lucide-react` |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — `/login`, `/signup`, `/reset` pages |
| File Storage | Supabase Storage (`daily-photos` bucket, public URLs) |
| Hosting | Vercel (auto-deploy on push to `main`) |

### Architecture

```
src/
  App.tsx               — shell: auth gate, layout, theme, useVoyageData wiring
  main.tsx              — React root, QueryClientProvider, BrowserRouter
  router.tsx            — createBrowserRouter scaffold (Phase 2 reference)
  types.ts              — legacy app-shape types (Voyage, DailyLog, etc.)
  types/models.ts       — spec types (Post, Audience, Contact, Media, FeedEntry)

  pages/                — full page components (one per route)
    LoginPage.tsx           /login
    SignupPage.tsx           /signup
    ResetPasswordPage.tsx   /reset
    VoyagesPage.tsx          /voyages
    VoyageDetailPage.tsx     /voyages/:id  (tabbed: Posts + journal sections)
    VoyageEditorPage.tsx     /voyages/new + /voyages/:id/edit
    PostComposerPage.tsx     /voyages/:id/posts/new
    PostEditorPage.tsx       /voyages/:id/posts/:postId/edit
    PostDetailPage.tsx       /voyages/:id/posts/:postId
    FeedPage.tsx             /feed  (React Query, get_feed RPC)
    ContactsPage.tsx         /contacts + /friends
    ProfilePage.tsx          /userprofile  (identity: hero, passport map, personality, badges)
    SettingsPage.tsx         /settings     (Appearance, Preferences, Settings & Export)

  features/
    voyages/            — VoyageCard, VoyageForm, ItineraryEditor, VoyageHero,
                          VoyageProfile, VoyageMetrics, hooks.ts
    voyages/dashboard/  — BudgetBreakdown, ItineraryTimeline, PortsMap, RecentPosts
    posts/              — PostCard (feed), JournalPostCard, PostList,
                          PostEditorForm, AudiencePill, AudienceSelector,
                          EditConfirmBanner, mediaStorage.ts, hooks.ts
    feed/               — FeedItem, feedVisibility.ts, hooks.ts
    contacts/           — ContactRow, FamilyToggle, FriendProfile, hooks.ts
    auth/               — (placeholder for future auth helpers)

  sections/             — legacy journal sub-sections, used as tabs in VoyageDetailPage
    BudgetTracker, DailyLog, DiningLog, EntertainmentLog, FoodFavourites,
    FoodLog, Highlights, Notes, PackingList, ShoppingLog, Chat, DayDetail

  ui/                   — shared UI primitives (spec §5)
    MediaUploader.tsx   — drag-drop multi-file uploader
    MediaThumbnails.tsx — responsive grid with swipe lightbox

  components/
    TopNav.tsx          — sole desktop nav: wordmark (→ home), nav links, search,
                          profile dropdown (email, Profile, Admin, Sign out)
    BottomNav.tsx       — mobile tab bar (voyage-aware active state)
    ui/                 — Card, Button, MetricCard, StarRating, Skeleton,
                          EmptyState, AudienceSelector, SectionBox, Label, Input

  hooks/
    useVoyageData.ts    — legacy debounced write-through for journal sections
    useFeedData.ts      — legacy feed data (dashboard social feed)
    useBreakpoint.ts

  lib/
    queryClient.ts      — TanStack Query singleton
    supabase.ts         — Supabase client
    converters.ts       — DB ↔ app shape converters
    photoStorage.ts     — signed URL photo fetch (daily-photos bucket)
    motion.ts           — shared Framer Motion variants
    atmosphere.ts       — time-of-day gradients for hero
```

### Key patterns

- **Routing**: `<BrowserRouter>` + `<Routes>/<Route>` in App.tsx. New spec pages at `/voyages/*`. Legacy routes at `/`, `/feed`, `/profile`, `/chat` etc. Old solo section routes (`/daily` etc.) redirect to `/voyages`.
- **Data fetching**: TanStack Query for all spec data (voyages, posts, feed, contacts). Legacy `useVoyageData` hook for journal section data passed as props to VoyageDetailPage tabs.
- **Auth gate**: App.tsx checks `!session` → renders `<LoginPage>` / `<SignupPage>` / `<ResetPasswordPage>` via inner `<Routes>`. No separate auth shell needed.
- **Journal sections**: Accessible only through VoyageDetailPage tabs (`/voyages/:id?tab=daily`). Sidebar "Your Journal" section hidden on all pages except `/voyages/:id`.
- **Posts**: `posts` table with `audience` (private|family|public), `media_paths TEXT[]`, `metadata JSONB` (migrated daily-log fields). Feed uses `get_feed()` Supabase RPC.
- **Theme flash prevention**: `index.html` inline `<script>` applies CSS vars before React mounts.
- **Photos**: `daily-photos` bucket (public). Post media at `{userId}/posts/{uuid}.{ext}`. Use `getPublicUrl()` — no signed URLs needed for public bucket.

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
| daily | Daily Log | `05_daily_log_page_a.pdf` + `06_daily_log_page_b.pdf` | **Narrative journal page** — `sections/dailylog/JournalEntry.tsx`: warm serif prose blocks + inline photos in an ordered top-to-bottom flow (no drag), gentle prompt chips that append a seeded paragraph, weather/rating in a slim header. Body stored in `daily_logs.canvas` (jsonb, `CanvasItem[]` in array order); `deriveStructured.ts` write-through keeps the structured columns (→ dashboard/metrics/export) in sync. Rides the existing `dailyLogs` offline path. Old form kept at `sections/DailyLog.tsx` (landing preview). |
| food | Food Log | `07_food_log.pdf` + `07_food_log_b.pdf` | Built |
| dining | Restaurant Log | `10_dining_log.pdf` | Built |
| entertainment | Entertainment Log | — | Built |
| foodfav | Food Favourites | `08_food_favourites.pdf` | Built |
| budget | Budget Tracker | `09_budget_tracker.pdf` | Built |
| shopping | Shopping Log | `11_souvenirs_shopping.pdf` | Built |
| highlights | Highlights | `12_cruise_highlights.pdf` | Built |
| packing | Packing List | `03_packing_checklist.pdf` | Built |
| notes | Notes | `13_notes.pdf` | **Draggable sticky board** — `sections/notes/NotesBoard.tsx` + `DraggableSticky.tsx`: each sticky is a `notes` row carrying board position (`x_pct`/`y`) + `color`, so drag = a row update and it rides the co-author-safe per-row notes sync. Text-only v1. Old grid kept at `sections/Notes.tsx` for the landing preview. |

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

### Completed (Phases 0–7)
- [x] User accounts & login (Supabase Auth)
- [x] Multiple voyages — switch between past / future cruises
- [x] Mobile responsive layout — collapsible sidebar, bottom tab bar, touch-friendly
- [x] Photo uploads — drag-and-drop in Daily Log, signed URLs, lightbox gallery
- [x] Social feed — reactions, comments, friend posts, QuickComposer
- [x] Design system — Tailwind v4, shadcn primitives, motion language
- [x] Dashboard — interactive metric cards, sparklines, budget breakdown, itinerary timeline, ports map
- [x] Daily Log — tabbed card UI, animated weather chips, swipe pager, drag-drop photos
- [x] Itinerary — visual vertical timeline, drag-to-reorder, inline edit, animated Add Day
- [x] Accessibility — focus-visible ring, ARIA roles, focus trap on mobile drawer, reduced-motion
- [x] Performance — React.lazy code-splitting for all sections, PortsMap lazy-loaded
- [x] PWA — manifest.json, theme-color, apple-touch-icon, mobile-web-app-capable

### Near-term
- [x] Export to PDF — printable keepsake journal. Shared renderer in
  `src/lib/voyageExport.ts` (`exportJournalPdf`): styled cover, per-voyage chapters,
  photos, stats, opened in a print window. Settings exports all voyages; the
  "Export" button on `VoyageDetailPage` scopes to a single voyage (`{ voyageId }`).
- [ ] Social sharing — shareable public highlight pages (like a Facebook post)
- [ ] Service worker — offline shell caching + background sync
- [ ] Push notifications — react to friends' posts while offline

### Future
- [ ] AI assistant — port suggestions, excursion tips based on logged preferences
- [ ] Weather integration — auto-fill weather from departure date + port
- [ ] Packing list customisation — add/remove items, create custom categories
- [x] Multi-user voyages — **co-author mode shipped, incl. full co-editing.** Owner
  invites others via `voyage_members` (table + RLS + `is_voyage_member()` helper);
  members can add photos/posts AND edit the journal sections. Concurrent edits use
  **per-row merge with explicit deletes**: writes upsert per row and delete only the
  ids the user removed (`SyncQueueItem.deletedIds`, `db/rowDiff.ts`) — co-authors'
  rows are never wiped. Same-row/same-day edits and the singleton sections (voyage,
  food_favourites, highlights) are last-write-wins (documented). Hooks in
  `features/voyages/coauthors.ts`; UI in `CoAuthorsPanel`, `VoyageInvitesBanner`.
  **Note:** offline packing *un*-checks reconcile online only (replay is additive).
- [ ] Photo multi-upload carousel in feed posts (data model: photos[] per day)
- [ ] TypeScript strict mode — currently `strict: false`; converter layer is the highest-value first target

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
