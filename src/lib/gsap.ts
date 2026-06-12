// ─────────────────────────────────────────────────────────────────────────────
// lib/gsap.ts — GSAP setup shared by all GSAP-driven animation
//
// GSAP complements Framer Motion in this codebase, it does not replace it:
//   Framer Motion → component-level variants (REVEAL, PAGE_TRANSITION, etc.)
//   GSAP          → imperative timelines and ScrollTrigger reveals on pages
//                   that have no Framer animation (Profile, Settings) and
//                   micro-interactions (TopNav dropdown).
// Never point both libraries at the same element — they will fight over
// inline transform styles.
//
// The app scrolls inside <main> (App.tsx), not the window, so every
// ScrollTrigger must pass `scroller: 'main'` — use the SCROLLER constant.
// ─────────────────────────────────────────────────────────────────────────────

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** The app's overflow-y scroll container (see <main> in App.tsx). */
export const SCROLLER = 'main'

/** Honour the OS "Reduce motion" setting — callers skip animation when true. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export { gsap, ScrollTrigger }
