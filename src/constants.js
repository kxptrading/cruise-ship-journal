// ─────────────────────────────────────────────────────────────────────────────
// constants.js — Design tokens, icons, navigation, and shared styles
//
// Single source of truth for every visual and structural decision in the app.
// Importing from here (rather than hardcoding values in components) means a
// colour or spacing change only needs to happen in one place.
// ─────────────────────────────────────────────────────────────────────────────

// ── Colour palette ────────────────────────────────────────────────────────────
// Theme-aware tokens — NAVY/NAVY2/GOLD/CREAM resolve via CSS variables set by
// the active theme (see themes.js). All other colours are neutral/fixed.
export const NAVY   = 'var(--t-primary)'      // Primary brand colour
export const NAVY2  = 'var(--t-primary-dk)'   // Darker shade of primary
export const GOLD   = 'var(--t-accent)'        // Accent colour
export const CREAM  = 'var(--t-bg)'            // Page background
export const WHITE  = '#FFFFFF'               // Card backgrounds (fixed)
export const BORDER = '#E5E7EB'               // Borders and dividers (fixed)
export const TEXT   = '#1C2B3A'               // Body copy (fixed)
export const MUTED  = '#6B7280'               // Labels, secondary text (fixed)
export const LIGHT  = '#F9FAFB'               // Alternating rows, box backgrounds (fixed)
export const TEAL   = '#10B981'               // Ports, positive metrics (fixed)
export const ROSE   = '#F97316'               // Ratings, emotional metrics (fixed)
export const PLUM   = '#8B5CF6'               // Packing, completion metrics (fixed)
export const CORAL  = '#F97316'               // Pull-quotes, highlights (fixed)

// ── Per-section accent colours ────────────────────────────────────────────────
// Used to tint section header bars, PgHdr underlines, and completion dots.
export const SECTION_COLORS = {
  feed:          'var(--t-primary)',
  voyage:        'var(--t-primary)',
  itinerary:     '#10B981',
  daily:         'var(--t-primary)',
  food:          '#F97316',
  dining:        '#F97316',
  entertainment: '#8B5CF6',
  foodfav:       'var(--t-accent)',
  budget:        '#10B981',
  shopping:      'var(--t-accent)',
  highlights:    '#F97316',
  packing:       'var(--t-accent)',
  notes:         '#8B5CF6',
}

// ── Typography ────────────────────────────────────────────────────────────────
export const FONT_DISPLAY = "'Fredoka One', cursive"
export const FONT_BODY    = "'Nunito', sans-serif"

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
  { id: 'daily',         label: 'Daily Log',          icon: '📅' },
  { id: 'voyage',        label: 'Voyage Details',     icon: '🚢' },
  { id: 'itinerary',     label: 'Itinerary',          icon: '🗺️' },
  { id: 'food',          label: 'Food Log',           icon: '🍴' },
  { id: 'dining',        label: 'Restaurant Log',     icon: '🍽️' },
  { id: 'entertainment', label: 'Entertainment Log',  icon: '🎭' },
  { id: 'foodfav',       label: 'Food Favourites',    icon: '💛' },
  { id: 'budget',        label: 'Budget Tracker',     icon: '💳' },
  { id: 'shopping',      label: 'Shopping Log',       icon: '🛍️' },
  { id: 'highlights',    label: 'Highlights',         icon: '🌟' },
  { id: 'packing',       label: 'Packing List',       icon: '🧳' },
  { id: 'notes',         label: 'Notes',              icon: '📝' },
]

// ── Shared component styles ───────────────────────────────────────────────────
// Reusable style objects applied to common UI elements. Kept here so padding,
// radius, and colour decisions are consistent across every section.
export const sty = {
  // White card with rounded corners — the primary content container
  card: { background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '22px 24px', marginBottom: 18 },
  // Standard text input / select styling.
  // fontSize is 16px — iOS Safari auto-zooms any input with font-size < 16px,
  // so this must stay at 16px or above to prevent unwanted zoom on mobile.
  inp:  { width: '100%', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: WHITE, color: TEXT },
  // Primary action button — ocean gradient, white text
  btn:  { background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', color: WHITE, border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, boxShadow: '0 4px 12px var(--t-btn-shadow)' },
  // Uppercase micro-label above form fields
  lbl:  { display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
}
