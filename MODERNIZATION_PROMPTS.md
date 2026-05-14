# Modernization Prompts — Cruise Ship Journal

A sequenced playbook of prompts to paste into Claude inside WebStorm. Each phase produces a
shippable increment. Run them in order — later phases assume the foundations from earlier ones.

Conventions used in every prompt below:
- "Read CLAUDE.md before you start" — anchors Claude to your design system and architecture.
- "Don't break working behavior" — protects the live Supabase data flow.
- "Show me the diff before applying" — keeps you in the driver's seat.

---

## Phase 0 — Tooling foundation

Goal: install the libraries the rest of the plan depends on, without touching feature code yet.

```
Read CLAUDE.md and the current package.json. I want to modernize the UI across motion, visual
polish, mobile, and data viz. Before touching any feature code, set up the tooling foundation:

1. Install and configure Tailwind CSS v4 alongside the existing inline-style system. Map every
   token in src/constants.js (NAVY, GOLD, CREAM, BORDER, etc.) to Tailwind theme colours and
   CSS variables so the 20 themes in src/themes.js continue to work. Both styling systems must
   coexist during migration — do not delete any inline styles yet.
2. Install Framer Motion (motion package) for animation, lucide-react for icons (we'll
   gradually replace the IC SVG object), and clsx + tailwind-merge for class composition.
3. Install shadcn/ui's CLI and initialise it pointing at src/components/ui. Don't add any
   components yet — just the scaffold.
4. Add a "prefers-reduced-motion" CSS rule that disables all transitions and animations.
5. Update CLAUDE.md's Architecture section to document the new tooling, and add a "Styling
   strategy" note explaining: new components use Tailwind + shadcn primitives, existing
   inline-styled components stay until migrated.

Show me the file changes and the new package.json before applying. Don't change any feature
code in this pass.
```

---

## Phase 1 — Responsive shell (mobile + touch)

Goal: the app works on a phone. Bottom nav, slide-out sidebar, touch-sized hit targets.

```
Read CLAUDE.md and src/App.jsx, src/components/Sidebar.jsx, src/components/TopNav.jsx,
src/constants.js. The app currently assumes desktop. Build a responsive shell:

1. Define breakpoints in Tailwind config: mobile (<768px), tablet (768-1024), desktop (>1024).
2. On mobile (<768px):
   - Hide the fixed Sidebar entirely. Replace with a slide-in drawer triggered by a hamburger
     in TopNav. Use Framer Motion for the slide-in/out with a backdrop fade. Close on backdrop
     tap, on nav-item tap, and on Escape.
   - Add a fixed bottom nav with the 5 most-used sections (Dashboard, Feed, Daily Log, Friends,
     Chat). Use lucide-react icons. Active state = gold icon + label, inactive = muted. Honour
     iOS safe-area-inset-bottom.
   - All tap targets must be ≥ 44×44px.
3. On tablet (768-1024): keep Sidebar but collapsed to icons-only. Show labels on hover (desktop)
   or tap-and-hold (touch).
4. On desktop: behaviour unchanged.
5. Add a useBreakpoint() hook in src/hooks/ that returns 'mobile' | 'tablet' | 'desktop'.
6. Test by resizing the browser. Show me screenshots of each breakpoint before we move on.

Preserve the existing routing, auth flow, and theme system. Do not change any section
components yet — only the shell.
```

---

## Phase 2 — Design system primitives

Goal: a small set of polished, reusable primitives. Everything later builds on these.

```
Read CLAUDE.md (especially Design System and Component Patterns) and src/sections/feed/PostCard.jsx
as the reference for current card styling. Build a Tailwind + shadcn primitive library in
src/components/ui/:

1. <Card> — three variants: 'flat' (current default), 'elevated' (subtle shadow + hover lift
   of 2px), 'glass' (backdrop-blur, semi-transparent white, used for hero panels over photos).
   Border radius 14px, border 1px BORDER. Compose with CardHeader, CardBody, CardFooter.
2. <SectionBox> — the navy header bar + LIGHT body pattern documented in CLAUDE.md, but as a
   real component instead of repeated inline styles.
3. <MetricCard> — coloured icon badge top-left, optional animated donut ring top-right, large
   serif value, uppercase MUTED label, optional progress bar at bottom. The value should
   count-up from 0 on mount using Framer Motion. Donut ring fills from 0 to its target on mount.
4. <StarRating> — interactive 5-star, gold filled / BORDER empty, 22px. Hover preview, click to
   set, animated star pop on selection. Read-only mode for display.
5. <Button> — primary (NAVY bg, white text), secondary (white bg, NAVY border), ghost
   (transparent, NAVY text), destructive (ROSE). All have a subtle scale-down to 0.97 on press
   via Framer Motion.
6. <Label> — the 11px / 700 / uppercase / 0.08em letter-spacing pattern.
7. <Input>, <Textarea>, <Select> — match design system, focus ring in GOLD at 2px offset.
8. <Skeleton> — shimmer loader for cards while Supabase fetches.
9. <EmptyState> — illustration slot + heading + body + CTA, used wherever there's no data.

Each primitive needs: TypeScript-ready props (use JSDoc since we're still on JS), a default
export, and a usage example in a comment at the top of the file. Build a /design-system route
that renders every primitive in every state — this is our living style guide.

Don't refactor any feature components in this pass.
```

---

## Phase 3 — Motion language

Goal: define the motion vocabulary once, apply it everywhere.

```
Read CLAUDE.md and Phase 2's components. Define and document a motion language for the app
in src/lib/motion.js:

1. Export reusable Framer Motion variants:
   - fadeUp (opacity 0→1, y 12→0, duration 0.3, ease easeOut) — for content entering view
   - stagger (children animate in 0.05s apart) — for lists and feeds
   - pageTransition (opacity + 8px y shift) — for section route changes
   - modal (scale 0.96→1 + opacity) — for dialogs
   - drawer (x: -100%→0 with backdrop fade) — for mobile nav
2. Wrap the section router in App.jsx with AnimatePresence so section changes animate.
3. In Feed.jsx, wrap the post list in a staggered container so cards appear in sequence on
   first load. New posts inserted at the top should slide down existing posts.
4. PostCard reactions: when a reaction is added, animate a +1 floating up and fading, and a
   tiny scale bounce on the reaction button itself.
5. Hero on Dashboard: when scroll position > 100px, gradually fade the hero opacity to 0.4
   and add a backdrop-blur. Use useScroll from Framer Motion.
6. Respect prefers-reduced-motion globally — all variants degrade to opacity-only or no motion.

Show me one section fully wired up (suggest Feed) before applying the same patterns elsewhere.
```

---

## Phase 4 — Dashboard reimagined (interactive data viz)

Goal: turn the dashboard from a static metric grid into a live, explorable overview.

```
Read CLAUDE.md (Dashboard Metrics Explained section) and the current Dashboard implementation.
Rebuild the dashboard using the Phase 2 primitives and these enhancements:

1. Hero: keep the voyage progress bar but make it interactive — hovering shows a tooltip with
   exact days remaining, current port, days at sea remaining.
2. Metric cards: use the new <MetricCard> with count-up animation. Add a 7-day sparkline below
   each numeric metric (Days Logged, Total Spent, Avg Day Rating) using recharts. Sparklines
   coloured per the metric's theme colour.
3. Budget breakdown: replace the current display with an interactive stacked horizontal bar
   showing spend by category (Excursions, Drinks, Shopping, Dining, Other). Hover any segment
   to see category total + % of budget. Animate the bar filling in on mount. If overspent,
   the over-budget portion is in ROSE with a subtle pulse animation.
4. Itinerary timeline: build an interactive horizontal scroll-snap timeline of all 14 days.
   Each day is a card with date, port, weather emoji. The current day (based on today's date
   vs voyage.departureDate) is highlighted in GOLD and scrolled into view on mount. Click any
   day to jump to its Daily Log entry.
5. Ports map: add a Leaflet map (react-leaflet) showing every port in the itinerary as a pin,
   connected by a dotted line in voyage order. Departure port is anchored in NAVY, visited
   ports in TEAL, upcoming in MUTED. Click a pin to see the port's daily-log summary.
6. Recent posts: a 3-up grid of the latest feed posts as small cards, click to open in Feed.

Performance: lazy-load the map (dynamic import) so the dashboard's initial render is fast.
Show me the new dashboard before touching anything else.
```

---

## Phase 5 — Feed glow-up

Goal: the feed feels like a polished social product, not a CRUD list.

```
Read CLAUDE.md and src/sections/Feed.jsx, src/sections/feed/PostCard.jsx,
src/sections/feed/QuickComposer.jsx, src/sections/feed/VoyageHero.jsx. Modernize:

1. PostCard:
   - Replace inline styles with the Phase 2 <Card variant="elevated">.
   - Photos: if a post has multiple photos, build a swipeable carousel (Embla Carousel) with
     dot indicators. Single photo gets a tap-to-lightbox.
   - Long captions auto-truncate with a "Read more" toggle that animates the expansion.
   - Reactions: bigger, more tactile. Long-press on the reaction button (mobile) or hover
     (desktop) opens a quick-pick of 6 reactions that animate up on a curve. Selecting one
     animates it into the button.
   - Comments: collapsed by default with "View 4 comments" link. Tapping animates them in,
     stagger-fading. Reply input slides up from the bottom of the card.
2. QuickComposer:
   - Always-visible compact bar at the top of the feed showing the user's avatar + "Share
     your day…" placeholder. Tapping expands it into a full composer with: photo attach
     (with thumbnail preview row), location picker (from this voyage's ports), mood selector
     (5 emoji), and a Post button that's disabled until there's content. The expansion is
     animated, the collapse animates back.
   - Drag-and-drop photo onto the composer to attach.
3. VoyageHero:
   - Full-bleed background image (use voyage's cover photo if present, else a navy gradient
     with the ship name in a serif display font). Parallax scroll: background moves at 0.4×
     scroll speed.
   - Floating glass card on top with voyage name, dates, day count, and a "Currently in [port]"
     pill if the voyage is active today.
4. Pull-to-refresh on mobile triggers useVoyageData's reload.
5. Infinite scroll for older posts with skeleton placeholders while loading.

Preserve all existing Supabase write paths. Show me PostCard's before/after first.
```

---

## Phase 6 — Daily Log and Itinerary

Goal: the two highest-use sections feel as polished as the Feed.

```
Read CLAUDE.md and the current Daily Log and Itinerary section components. Apply the Phase 2
primitives and:

1. Daily Log:
   - Replace the current form-grid layout with a day-by-day card flow. Each day's card has
     tabs: Weather, Food, Activity, Highlight, Rating. Tab switching animates the underline
     and content with a horizontal swipe transition.
   - Weather chip selector becomes a row of animated icons that scale-up on select.
   - StarRating uses the new interactive component.
   - Add a "previous / next day" pager at the bottom with swipe gestures on mobile.
   - Photo memory slots: dropzone with drag-and-drop, in-place crop after upload, gallery
     view on tap.
2. Itinerary:
   - Visual timeline view by default — vertical on mobile, horizontal on desktop.
   - Each day shows: date pill (gold if today, navy if past, light if future), port name in
     display serif, arrive/depart times, and a small ship icon for sea days.
   - Drag-and-drop to reorder days (with optimistic UI + Supabase upsert on drop).
   - "Add port" button at the end of the timeline opens an inline editor that animates in.

Don't change the Supabase data shape — just the UI. Show me the Daily Log redesign first.
```

---

## Phase 7 — Accessibility, performance, and the final polish

Goal: ship-quality across keyboard, screen reader, slow connections.

```
Read CLAUDE.md. Do a full accessibility + performance pass:

1. Accessibility:
   - Every interactive element keyboard-reachable, focus ring visible (gold, 2px offset).
   - All icons have aria-labels.
   - Sidebar, drawer, modals use proper ARIA roles and focus-trap when open.
   - Colour contrast: audit every text/background pair against WCAG AA. Flag any failures
     and propose fixes that stay within the design palette.
   - All animations honour prefers-reduced-motion.
   - Run axe-core in dev and fix every reported violation.
2. Performance:
   - Code-split every section component with React.lazy so the initial bundle is just the
     shell, dashboard, and feed.
   - Lazy-load Leaflet, Embla Carousel, and any other heavy deps.
   - Replace IC SVG paths with tree-shakeable lucide-react imports.
   - Audit re-renders with the React DevTools Profiler — fix any obvious wasted renders in
     Feed and Dashboard (memo + useMemo where data is stable).
   - Add a service worker that caches the shell for offline (we already have this on the
     roadmap).
3. Polish:
   - Empty states for every section — illustration + heading + CTA.
   - Toast notifications (sonner) for save success, save errors, offline indicator.
   - 404 / "voyage not found" route.
   - Update the favicon and PWA manifest to match the navy+gold brand.

Report what you found and changed. Update CLAUDE.md's Roadmap section to mark completed
items and add any newly-discovered ones.
```

---

## How to use this file

1. Open WebStorm, open the Claude side panel.
2. Start with Phase 0. Paste the prompt verbatim. Review the diff, accept, commit.
3. Move to the next phase only when the previous one is shipped and you've tried it on a real
   device.
4. After each phase, ask Claude: "What did we change? Update CLAUDE.md to reflect the new state."
   Your CLAUDE.md is your source of truth — keeping it current means the next prompt has good
   context.

If a phase produces too much change at once, ask Claude to split it: "Just do step 1 of this
prompt and stop." Phased acceptance keeps the diff reviewable.
