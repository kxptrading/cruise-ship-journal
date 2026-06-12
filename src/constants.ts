// ─────────────────────────────────────────────────────────────────────────────
// constants.ts — Design tokens, icons, navigation, and shared data
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'

// ── Colour palette ────────────────────────────────────────────────────────────
export const NAVY   = 'var(--t-primary)'
export const NAVY2  = 'var(--t-primary-dk)'
export const GOLD   = 'var(--t-accent)'
export const CREAM  = 'var(--t-bg)'
export const WHITE  = '#FFFFFF'
export const BORDER = '#E5E7EB'
export const TEXT   = '#1C2B3A'
export const MUTED  = '#6B7280'
export const LIGHT  = '#F9FAFB'
export const TEAL   = '#10B981'
export const ROSE   = '#F97316'
export const PLUM   = '#8B5CF6'
export const CORAL  = ROSE

// ── Per-section accent colours ────────────────────────────────────────────────
export const SECTION_COLORS: Record<string, string> = {
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
export const FONT_DISPLAY = 'Georgia, "Times New Roman", serif'
export const FONT_BODY    = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
export const FONT_LOGO    = "'Space Grotesk', sans-serif"

// ── Responsive breakpoints (px) ───────────────────────────────────────────────
export const BP: { mobile: number; tablet: number } = { mobile: 640, tablet: 1024 }

// ── SVG icon paths ────────────────────────────────────────────────────────────
export const IC: Record<string, string> = {
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
  menu:     'M3 12h18M3 6h18M3 18h18',
  play:     'M12 22a10 10 0 100-20 10 10 0 000 20zM10 8l6 4-6 4V8z',
}

// ── Navigation items ──────────────────────────────────────────────────────────
export interface NavItem {
  id:    string
  label: string
  icon:  string
}

// Primary navigation — shown at the top of the sidebar
export const PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Home',       icon: '🏠' },
  { id: 'voyages',  label: 'My Voyages', icon: '🚢' },
  { id: 'feed',     label: 'Feed',       icon: '📡' },
  { id: 'friends',  label: 'Buddies',    icon: '👥' },
  { id: 'chat',     label: 'Messages',   icon: '💬' },
]

// Journal sub-sections — shown in the sidebar under a divider (legacy routes)
export const NAV: NavItem[] = [
  { id: 'daily',         label: 'Daily Log',          icon: '📅' },
  { id: 'itinerary',     label: 'Itinerary',          icon: '🗺️' },
  { id: 'food',          label: 'Food Log',           icon: '🍴' },
  { id: 'dining',        label: 'Restaurant Log',     icon: '🍽️' },
  { id: 'entertainment', label: 'Entertainment Log',  icon: '🎭' },
  { id: 'foodfav',       label: 'Food Favourites',    icon: '💛' },
  { id: 'budget',        label: 'Budget Tracker',     icon: '💳' },
  { id: 'shopping',      label: 'Shopping Log',       icon: '🛍️' },
  { id: 'highlights',    label: 'Highlights',         icon: '🏆' },
  { id: 'packing',       label: 'Packing List',       icon: '🧳' },
  { id: 'notes',         label: 'Notes',              icon: '📝' },
]

// ── Weather chip data ─────────────────────────────────────────────────────────
export const WX_EMOJI: Record<string, string> = {
  Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️',
  Windy: '💨', Hot: '🌡️', Mild: '🌤️', Cool: '❄️',
}

export interface WxChipStyle {
  background: string
  border:     string
  color:      string
}

export const WX_STYLE: Record<string, WxChipStyle> = {
  Sunny:  { background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' },
  Hot:    { background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B' },
  Rainy:  { background: '#EFF6FF', border: '1px solid #93C5FD', color: '#1D4ED8' },
  Cloudy: { background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151' },
  Windy:  { background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155' },
  Mild:   { background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534' },
  Cool:   { background: '#EFF6FF', border: '1px solid #BAE6FD', color: '#0369A1' },
}

// ── Shared component styles ───────────────────────────────────────────────────
export const sty: Record<string, CSSProperties> = {
  card: { background: WHITE, borderRadius: 22, border: 'none', padding: '24px 26px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 24px rgba(0,0,0,0.07)' },
  inp:  { width: '100%', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: WHITE, color: TEXT },
  btn:  { background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', color: WHITE, border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, boxShadow: '0 4px 12px var(--t-btn-shadow)' },
  lbl:  { display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
}
