// ─────────────────────────────────────────────────────────────────────────────
// context.jsx — Window width context for responsive layouts
//
// Provides the current viewport width to any component via useW(), avoiding
// prop-drilling through the entire tree. The root App measures the window and
// passes the value down through WCtx; section components call useW() to read
// it and adjust their layouts at BP.mobile and BP.tablet breakpoints.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from 'react'

// Default value of 1200 means components render in desktop layout on the
// server or before the first paint, avoiding a layout flash.
export const WCtx = createContext(1200)

// Convenience hook — call inside any component to get the current width.
export const useW = () => useContext(WCtx)

// Voyage context — provides the active voyage ID to any component via
// useVoyageId(), avoiding prop-drilling through the entire section tree.
export const VoyageCtx = createContext(null)
export const useVoyageId = () => useContext(VoyageCtx)

// User context — provides the authenticated user's ID so photo storage
// functions can build the correct storage path without needing session props.
export const UserCtx = createContext(null)
export const useUserId = () => useContext(UserCtx)

// Custom hook used once in App.jsx to measure and track the window width.
// Cleans up its own resize listener on unmount.
export function useWindowSize() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}
