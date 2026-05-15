// ─────────────────────────────────────────────────────────────────────────────
// lib/queryClient.ts — TanStack Query client singleton
//
// Import this instance (not a new QueryClient) everywhere you need to
// manually invalidate or read the cache outside of a React component.
// The QueryClientProvider in main.tsx uses this same instance.
// ─────────────────────────────────────────────────────────────────────────────

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 2,   // 2 min — data fresh for 2 min before refetch
      gcTime:               1000 * 60 * 10,  // 10 min — unused cache kept for 10 min
      retry:                1,               // one retry on failure
      refetchOnWindowFocus: false,           // journal data doesn't need aggressive refetching
    },
    mutations: {
      retry: 0,
    },
  },
})
