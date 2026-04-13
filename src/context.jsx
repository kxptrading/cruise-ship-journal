import { createContext, useContext, useState, useEffect } from 'react'

export const WCtx = createContext(1200)
export const useW = () => useContext(WCtx)

export function useWindowSize() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}
