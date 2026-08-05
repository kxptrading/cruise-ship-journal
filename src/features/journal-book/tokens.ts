// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/tokens.ts — design tokens for the Voyage Journal "book"
//
// SCOPED TO THIS FEATURE ONLY. The book uses a warm scrapbook palette + Caveat/
// Nunito type that deliberately departs from the app's navy/gold nautical system
// (per the design handoff in Resources/design_handoff_voyage_journal). Do NOT
// import these into the global design system or vice-versa — keeping them
// separate is what lets the book look like a different artefact from the app.
//
// Values are taken verbatim from the handoff README "Design Tokens".
// ─────────────────────────────────────────────────────────────────────────────

export const BOOK = {
  // Colours
  paper:     '#f6efe0', // page background
  card:      '#fffdf8', // polaroid / card white
  ink:       '#2d2a24', // primary text
  inkSoft:   '#55503f', // secondary text
  terracotta:'#cc6b49', // primary accent (titles, day numbers, captions labels)
  teal:      '#3f7d78', // "Today's Story" heading, accents
  mustard:   '#dba43b', // sunny weather chip, stripes
  rose:      '#d98a86', // washi tape, accents
  olive:     '#7c8a5e', // location label, ticket stub
  // Hairlines / dashes (opacity varies with emphasis)
  hair:      'rgba(45,42,36,0.15)',
  hairMid:   'rgba(45,42,36,0.25)',
  hairStrong:'rgba(45,42,36,0.35)',
  // Paper dot-grain texture (radial dots on a 14px grid)
  grain:     'radial-gradient(circle at 20px 20px, rgba(45,42,36,0.05) 1px, transparent 1.5px)',
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
