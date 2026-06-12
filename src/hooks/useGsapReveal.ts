// ─────────────────────────────────────────────────────────────────────────────
// hooks/useGsapReveal.ts — GSAP entrance + scroll-reveal hooks
//
// useGsapStagger — staggered fade-up of a container's direct children when the
//                  component mounts. For pages where most content is above the
//                  fold (e.g. Settings).
//
// useGsapReveal  — each direct child fades up as it scrolls into view
//                  (ScrollTrigger against the <main> scroller, fires once).
//                  For long pages (e.g. Profile). Pass deps that gate content
//                  rendering (e.g. a `loading` flag) so the hook re-runs after
//                  the real content mounts.
//
// Both no-op (content fully visible) when the OS requests reduced motion.
// ─────────────────────────────────────────────────────────────────────────────

import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger, SCROLLER, prefersReducedMotion } from '../lib/gsap'

export function useGsapStagger<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        Array.from(el.children).filter(c => getComputedStyle(c).display !== 'none'),
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.09, clearProps: 'opacity,visibility,transform' },
      )
    }, el)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

export function useGsapReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    // Resolve the scroller OUTSIDE the gsap.context: selector strings inside a
    // scoped context are queried against the scope element, so the string
    // 'main' would (silently) fail to resolve and crash ScrollTrigger.
    const scroller = document.querySelector(SCROLLER)
    if (!scroller) return

    const ctx = gsap.context(() => {
      Array.from(el.children).filter(c => getComputedStyle(c).display !== 'none').forEach(child => {
        gsap.fromTo(
          child,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: child as Element,
              scroller,
              start: 'top 92%',
              once: true,
            },
          },
        )
      })
      // Child sections fetch their own data and grow after mount — recompute
      // trigger positions once the first paint settles.
      requestAnimationFrame(() => ScrollTrigger.refresh())
    }, el)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
