// ─────────────────────────────────────────────────────────────────────────────
// context.tsx — Window width context for responsive layouts
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from 'react'

export const WCtx = createContext<number>(1200)
export const useW = (): number => useContext(WCtx)

export const VoyageCtx = createContext<string | null>(null)
export const useVoyageId = (): string | null => useContext(VoyageCtx)

export const UserCtx = createContext<string | null>(null)
export const useUserId = (): string | null => useContext(UserCtx)

export type IconPack = 'fluent' | 'native' | 'lucide'
export const IconPackCtx = createContext<IconPack>('fluent')
export const useIconPack = (): IconPack => useContext(IconPackCtx)

export function useWindowSize(): number {
  const [w, setW] = useState<number>(() => window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}
