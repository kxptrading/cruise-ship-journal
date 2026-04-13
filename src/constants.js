// ─────────────────────────────────────────────────────────────────────────────
// constants.js — Design tokens, icons, navigation, and shared styles
//
// Single source of truth for every visual and structural decision in the app.
// Importing from here (rather than hardcoding values in components) means a
// colour or spacing change only needs to happen in one place.
// ─────────────────────────────────────────────────────────────────────────────

// ── Colour palette ────────────────────────────────────────────────────────────
// All colours are locked to this palette. Do not introduce new colours without
// updating CLAUDE.md and discussing with the team.
export const NAVY   = '#1B3A5C'  // Primary brand — headings, sidebar active states
export const NAVY2  = '#14293F'  // Dark surfaces — sidebar bg, hero panels
export const GOLD   = '#C9A227'  // Accent — highlights, star ratings, progress fills
export const CREAM  = '#F4F1EB'  // Page background
export const WHITE  = '#FFFFFF'  // Card backgrounds
export const BORDER = '#E0DBD0'  // All borders and dividers
export const TEXT   = '#1C2B3A'  // Body copy
export const MUTED  = '#7A8594'  // Labels, secondary text, placeholders
export const LIGHT  = '#F9F7F3'  // Alternating table rows, box backgrounds
export const TEAL   = '#0D6B55'  // Ports, positive metrics
export const ROSE   = '#B03060'  // Ratings, emotional metrics
export const PLUM   = '#4A3B8C'  // Packing, completion metrics

// ── Responsive breakpoints (px) ───────────────────────────────────────────────
// mobile  — single-column layout, compact padding, hamburger nav
// tablet  — sidebar becomes an overlay drawer (not always visible)
export const BP = { mobile: 640, tablet: 1024 }

// ── SVG icon paths ────────────────────────────────────────────────────────────
// Stroke-based paths for use with <SvgIcon>. All drawn on a 24×24 viewBox
// with strokeWidth 2, strokeLinecap round, strokeLinejoin round.
export const IC = {
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  mapPin:   'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  fork:     'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2l-3 4.5L15 2v13a2 2 0 002 2h2a2 2 0 002-2z',
  wallet:   'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5H5a2 2 0 01-2-2V5zM18 12h.01',
  check:    'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  anchor:   'M12 2a3 3 0 100 6 3 3 0 000-6zM12 8v13M5 15h14M4 19c0 1.1 3.58 2 8 2s8-.9 8-2',
  compass:  'M12 22a10 10 0 100-20 10 10 0 000 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  trending: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  food:     'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3',
  ship:     'M2 21h20M4 21V10l8-7 8 7v11M9 21V13h6v8',
  menu:     'M3 12h18M3 6h18M3 18h18',  // Hamburger — mobile nav toggle
  play:     'M12 22a10 10 0 100-20 10 10 0 000 20zM10 8l6 4-6 4V8z',  // Entertainment
}

// ── Navigation items ──────────────────────────────────────────────────────────
// Defines the sidebar order, route IDs, display labels, and icons for all 13
// journal sections. Adding a new section requires an entry here as well as a
// corresponding key in INIT (App.jsx) and a render case in the App return.
export const NAV = [
  { id: 'dashboard',     label: 'Dashboard',         icon: IC.compass  },
  { id: 'voyage',        label: 'Voyage Details',     icon: IC.ship     },
  { id: 'itinerary',     label: 'Itinerary',          icon: IC.mapPin   },
  { id: 'daily',         label: 'Daily Log',          icon: IC.calendar },
  { id: 'food',          label: 'Food Log',           icon: IC.fork     },
  { id: 'dining',        label: 'Restaurant Log',     icon: IC.food     },
  { id: 'entertainment', label: 'Entertainment Log',  icon: IC.play     },
  { id: 'foodfav',       label: 'Food Favourites',    icon: IC.star     },
  { id: 'budget',        label: 'Budget Tracker',     icon: IC.wallet   },
  { id: 'shopping',      label: 'Shopping Log',       icon: IC.trending },
  { id: 'highlights',    label: 'Highlights',         icon: IC.star     },
  { id: 'packing',       label: 'Packing List',       icon: IC.check    },
  { id: 'notes',         label: 'Notes',              icon: IC.calendar },
]

// ── Shared component styles ───────────────────────────────────────────────────
// Reusable style objects applied to common UI elements. Kept here so padding,
// radius, and colour decisions are consistent across every section.
export const sty = {
  // White card with rounded corners — the primary content container
  card: { background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '22px 24px', marginBottom: 18 },
  // Standard text input / select styling.
  // fontSize is 16px — iOS Safari auto-zooms any input with font-size < 16px,
  // so this must stay at 16px or above to prevent unwanted zoom on mobile.
  inp:  { width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: WHITE, color: TEXT },
  // Primary action button — navy background, white text
  btn:  { background: NAVY, color: WHITE, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 },
  // Uppercase micro-label above form fields
  lbl:  { display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
}
