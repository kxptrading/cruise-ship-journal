// ─────────────────────────────────────────────────────────────────────────────
// lib/motion.ts — Shared Framer Motion variant vocabulary
//
// Import from here rather than defining motion variants inline.
// Wrap the app root with <MotionConfig reducedMotion="user"> (done in App.tsx)
// so all variants below automatically degrade to opacity-only for users who
// have enabled "Reduce motion" in their OS settings.
//
// Usage:
//   import { FADE_UP, STAGGER, PAGE_TRANSITION } from '@/lib/motion'
//   <motion.div variants={FADE_UP} initial="hidden" animate="visible" />
// ─────────────────────────────────────────────────────────────────────────────

import type { Variants, Transition } from 'framer-motion'

// ── Page-level section transition ─────────────────────────────────────────────
// Used in App.tsx around the section router with AnimatePresence mode="wait".
// Each section fades + slides up in, slides up + fades out.

export const PAGE_TRANSITION: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } as Transition },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.16, ease: 'easeIn' } as Transition },
}

// ── Content entering view ─────────────────────────────────────────────────────
// Pair with STAGGER on a parent container for sequential child animations.

export const FADE_UP: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } as Transition },
}

// ── Stagger container ─────────────────────────────────────────────────────────
// Wrap a list in a motion.div with these variants; children use FADE_UP.
// staggerChildren cascades the child delay automatically.

export const STAGGER: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 } as Transition,
  },
}

// ── Modal / dialog ────────────────────────────────────────────────────────────

export const MODAL: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1,    transition: { duration: 0.2, ease: 'easeOut' } as Transition },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } as Transition },
}

// ── Slide-in drawer (mobile nav) ──────────────────────────────────────────────
// Sidebar already uses these values inline; export here so future
// drawers/sheets can reuse them.

export const DRAWER: Variants = {
  initial: { x: '-100%', opacity: 0.6 },
  animate: { x: 0,       opacity: 1,   transition: { type: 'spring', damping: 30, stiffness: 320 } as Transition },
  exit:    { x: '-100%', opacity: 0.6, transition: { type: 'spring', damping: 30, stiffness: 320 } as Transition },
}

// ── Backdrop fade ─────────────────────────────────────────────────────────────

export const BACKDROP: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } as Transition },
  exit:    { opacity: 0, transition: { duration: 0.2 } as Transition },
}

// ── Scale pop (used for reaction button bounce, star rating pop, etc.) ────────

export const SCALE_POP = { scale: [1, 1.35, 0.92, 1.06, 1] }
export const SCALE_POP_TRANSITION: Transition = { duration: 0.38 }

// ── Reaction float (+emoji floats up and fades) ───────────────────────────────

export const REACTION_FLOAT: Variants = {
  initial: { opacity: 1, y: 0,   scale: 1 },
  animate: { opacity: 0, y: -44, scale: 1.4,
    transition: { duration: 0.75, ease: 'easeOut' } as Transition,
  },
}
