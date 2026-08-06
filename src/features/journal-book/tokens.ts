// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/tokens.ts — design tokens for the Voyage Journal "book"
//
// The book keeps the scrapbook LAYOUT + Caveat/Nunito handwriting (per the design
// handoff in Resources/design_handoff_voyage_journal) but is coloured with the
// APP's theme palette (navy / gold / cream) so it reads as part of the website
// and follows theme switching. Colours reference the shared CSS theme vars via
// src/constants (NAVY/GOLD/CREAM are `var(--t-*)`), so they re-theme for free.
// The `terracotta`/`mustard`/etc. keys are kept as stable semantic slots; only
// their values changed from the warm palette to the app palette.
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, NAVY2, GOLD, CREAM, WHITE, TEXT, MUTED, BORDER } from '../../constants'

export const BOOK = {
  // Surfaces
  paper:     CREAM,   // page background (var(--t-bg))
  card:      WHITE,   // polaroid / card white
  ink:       TEXT,    // primary text
  inkSoft:   MUTED,   // secondary text
  // Accents (mapped from the old scrapbook slots → app palette)
  terracotta:NAVY2,   // headings, day numbers, checklist labels (was warm terracotta)
  teal:      NAVY,    // secondary heading accent
  mustard:   GOLD,    // gold accent — sunny chip, mood dots, stamp, footer, tape
  rose:      GOLD,    // tape variety → gold
  olive:     MUTED,   // small uppercase labels (location, "belongs to")
  // Hairlines / dashes
  hair:      'rgba(28,43,58,0.14)',
  hairMid:   'rgba(28,43,58,0.22)',
  hairStrong:'rgba(28,43,58,0.32)',
  border:    BORDER,
  // Paper dot-grain texture (radial dots on a 14px grid) — subtle navy tint
  grain:     'radial-gradient(circle at 20px 20px, rgba(28,43,58,0.045) 1px, transparent 1.5px)',
  grainSize: '14px 14px',
} as const

export const BOOK_FONT = {
  hand: "'Caveat', cursive",             // handwriting: titles, day numbers, captions, checklist labels
  body: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", // narrative + UI
} as const

// Nominal page geometry: the handoff is a 6in × 9in portrait page; its absolute
// px coordinates are authored at 96dpi (6in = 576px, 9in = 864px, a 2:3 ratio).
// We keep that exact coordinate system so positions/sizes copy over verbatim, and
// the viewer scales the whole 576×864 box to fit the viewport (CSS transform).
export const PAGE_W = 576
export const PAGE_H = 864
export const PAGE_RATIO = PAGE_W / PAGE_H
