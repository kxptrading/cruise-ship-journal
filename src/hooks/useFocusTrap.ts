// ─────────────────────────────────────────────────────────────────────────────
// hooks/useFocusTrap.ts — Trap keyboard focus inside a container
//
// Usage:
//   const ref = useFocusTrap(isOpen)
//   <div ref={ref} role="dialog" aria-modal>…</div>
//
// When `active` becomes true, focus moves into the container and Tab/Shift+Tab
// cycle within it. When `active` becomes false, focus returns to the element
// that triggered the open.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap<T extends HTMLElement = HTMLElement>(active: boolean) {
  const ref         = useRef<T>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) {
      returnFocus.current?.focus()
      return
    }

    returnFocus.current = document.activeElement as HTMLElement

    const el = ref.current
    if (!el) return

    const getFocusable = () => Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))

    // Move focus into the container
    const focusable = getFocusable()
    if (focusable.length) focusable[0].focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (!items.length) { e.preventDefault(); return }
      const first = items[0]
      const last  = items[items.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active])

  return ref
}
