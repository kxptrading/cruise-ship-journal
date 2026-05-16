// ─────────────────────────────────────────────────────────────────────────────
// lib/queryClient.ts — TanStack Query client singleton
//
// SINGLETON PATTERN:
//   A single QueryClient instance is created here and shared across:
//     - main.tsx: passed to <QueryClientProvider> to power the React component tree.
//     - features/voyages/hooks.ts: invalidateVoyages() uses it outside components.
//
//   Always import this instance when you need to read or invalidate cache outside
//   of a React component (e.g. background sync callbacks, Supabase realtime handlers).
//   Never create a new QueryClient elsewhere — doing so creates a separate cache
//   that won't share data with the component tree.
//
// DEFAULT OPTIONS:
//   staleTime: 2 minutes
//     Data remains "fresh" for 2 minutes. Within this window, navigating to a
//     page that needs the same data will use the cache without refetching.
//     This is tuned for journal data that doesn't change frequently. The feed
//     (features/feed/hooks.ts) overrides this to 1 minute.
//
//   gcTime: 10 minutes
//     Unused cache entries (no active subscribers) are garbage-collected after
//     10 minutes. This means a user can navigate away and back to a voyage page
//     within 10 minutes and see cached data instantly.
//
//   retry: 1
//     One automatic retry on query failure before the error state is shown.
//     Handles transient network errors without requiring manual "try again".
//
//   refetchOnWindowFocus: false
//     Disabled intentionally. The app's data is user-authored (journal entries)
//     and doesn't change on a remote server while the user is working in the tab.
//     Aggressive refetching would cause unnecessary requests and could disrupt
//     a user who is actively editing a section. If realtime data becomes
//     important (e.g. social feed), enable this on a per-query basis via
//     the staleTime option instead.
//
//   mutations.retry: 0
//     Mutations (writes) are not retried. Retrying a create or delete could
//     cause duplicate rows or unintended data loss. The UI should surface the
//     error and let the user retry explicitly.
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
