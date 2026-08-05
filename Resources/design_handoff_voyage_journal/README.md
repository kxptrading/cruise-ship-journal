# Handoff: Voyage Journal (Scrapbook-Style Travel Diary)

## Overview
A printable/digital travel-journal layout: a cover page, a reusable blank daily-entry template, and 4 filled sample entries (Rome, Florence, Venice, Amalfi Coast) in a scrapbook aesthetic — handwritten display type, warm paper tones, polaroid-style photos, washi tape, and postal-stamp page markers. Designed as a 6in × 9in page-per-sheet document (portrait), suitable for print or on-screen viewing.

## About the Design Files
The files in this bundle are **design references built in HTML** — they show the intended look, layout, and content structure. They are not production app code. Treat the task as: **recreate this design in your target environment** (a static site generator, a React/Vue app, a PDF-generation pipeline, a print template system, etc.), using whatever stack your project already has, or picking the simplest appropriate one if starting fresh.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and decorative details (tape, polaroid frames, stamps, ruled lines) are final. Recreate pixel-close using the values in "Design Tokens" below.

## Screens / Pages
All 6 pages share one page box: 6in × 9in, portrait, cream paper background (#f6efe0) with a very subtle dot-grain texture (radial-gradient dots, 14px grid, ~5% black), padding ~36–40px on entry pages.

1. **Cover** — Purpose: journal title page. Large rotated "Voyage Journal" wordmark in Caveat 700 (~88px, terracotta #cc6b49, rotate -2deg), italic subtitle below, one large rotated polaroid photo slot (230×230px) with handwritten caption, a dashed-border circular "BON VOYAGE" stamp badge (top right), two washi tape strips (top corners), a dashed name-fill line near the bottom ("this journal belongs to"), and a striped terracotta/mustard footer band (22px tall, repeating 16px diagonal stripes).

2. **Template (blank)** — Purpose: reusable structure for a new day. Contains: "Day ___" + date blank (dashed underlines), "Location" label + dashed blank, a weather chip row (SUNNY/CLOUDY/RAINY/STORMY — unselected outline style) and a 5-dot mood scale, two rotated polaroid photo slots (150×120px) side by side, a ruled writing area titled "Today's Story" (27px line spacing, faint italic prompt text), and a highlights checklist ("I ate:", "I saw:", "I met:", "Favorite moment:") with dashed fill-in lines. Page-number stamp bottom right ("PAGE 02").

3–6. **Day 1–4 (filled samples)** — Same structural system as the template, filled in: header row (Day N, date, location, right-aligned), a filled weather chip (SUNNY solid mustard, or CLOUDY solid gray) + filled mood dots, a cluster of 2–3 rotated/overlapping polaroid photos with handwritten captions (scrapbook layout, varies per page — see each page's absolute positions in the HTML), a ~70–90 word narrative paragraph (Nunito 13.5px, line-height 1.7), and a filled checklist. Day 2 additionally includes a dashed-border "ticket stub" element (Trenitalia Roma→Firenze). Each has its own page-number stamp (PAGE 03–06).

## Interactions & Behavior
Static document — no app-level interactions. The only "dynamic" pieces in the source are three display toggles wired as component props/tweaks (see below); in a rebuild these can simply be conditional rendering or removed entirely if not needed:
- `showChecklist` — show/hide the highlights checklist block on every page.
- `showWeatherMood` — show/hide the weather-chip + mood-dot row (template page).
- `showTape` — show/hide decorative washi-tape strips and the ticket-stub element.

Photo placeholders are drag-and-drop image slots in the source (a custom `<image-slot>` web component); in a rebuild, treat each as a plain `<img>`/upload target sized and framed per the dimensions below.

## State Management
None required — this is a static content document, not an interactive app. If rebuilt as a real "fill in your own day" product, the natural state would be: per-entry form fields (date, location, weather, mood, story text, checklist answers) and per-entry uploaded photos, persisted to a backend or local storage.

## Design Tokens

**Colors**
- Paper background: `#f6efe0`
- Card/polaroid white: `#fffdf8`
- Ink (primary text): `#2d2a24`
- Ink soft (secondary text): `#55503f`
- Terracotta (primary accent): `#cc6b49`
- Teal: `#3f7d78`
- Mustard: `#dba43b`
- Dusty rose: `#d98a86`
- Olive: `#7c8a5e`
- Dashed/hairline: `rgba(45,42,36,0.15–0.35)` depending on emphasis

**Typography**
- Display/handwriting: **Caveat** (Google Font), weights 500/600/700 — used for day numbers, titles, captions, checklist labels.
- Body/UI: **Nunito** (Google Font), weights 400/600/700/800 — used for narrative text, labels, chips, page-number stamps.

**Spacing / Sizing**
- Page box: 6in × 9in portrait.
- Page padding: 36–40px.
- Polaroid frame padding: ~8–10px sides/top, ~26–34px bottom (caption space).
- Ruled-line spacing (writing area): 28px repeat, 1px rule at 15% black.
- Photo slot sizes vary 100–230px per placement (see each page in the HTML for exact px).

**Shape / Decoration**
- Polaroid shadow: `0 6-8px 14-20px rgba(0,0,0,0.15-0.18)`, slight box-shadow layering.
- Rotation range on photos/tape: -8deg to +11deg for scrapbook variety.
- Stamp badge: circle, `border: 2-3px dotted`, rotated 8-11deg.
- Washi tape: small rectangles, semi-transparent color fill, rotated -8 to +9deg.
- Page-number mark: 50px dotted circle, rotate -10deg, "PAGE NN" in Caveat.

## Assets
No external images — all photos are placeholder drop-slots (a custom `<image-slot>` web component in `image-slot.js`) the end user fills in themselves. Fonts are loaded from Google Fonts (Caveat, Nunito). No icon/SVG assets are used by design (decoration is done with plain CSS shapes/gradients).

## Files
- `Voyage Journal.dc.html` — the full design source (all 6 pages, inline-styled).
- `doc-page.js` — paginated-document shell component (owns print/page-box sizing; not app logic to port as-is, but shows the intended print geometry: fixed 6in×9in page box, one page per sheet).
- `image-slot.js` — drag-and-drop photo placeholder component (reference for intended photo-upload UX: click or drag to fill, persists across reload).
