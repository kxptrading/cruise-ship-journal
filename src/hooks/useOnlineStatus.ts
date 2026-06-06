// hooks/useOnlineStatus.ts — Reactive navigator.onLine with online/offline events

import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Synchronous snapshot — safe to call outside React (e.g. in syncService).
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
