// ─────────────────────────────────────────────────────────────────────────────
// router.tsx — Page-based route definitions (CRUISE_VOYAGE_JOURNAL_SPEC §4)
//
// NOT yet wired into main.tsx — App.tsx still drives routing in Phase 1.
// This file is the target state. Phase 2 will replace App.tsx's section-switch
// with <RouterProvider router={router} /> and build out the page components.
//
// Route map:
//   /                  → redirect to /voyages
//   /voyages           → VoyagesPage       (list of user's voyages)
//   /voyages/new       → VoyageEditorPage  (create)
//   /voyages/:id       → VoyageDetailPage  (posts list)
//   /voyages/:id/edit  → VoyageEditorPage  (edit)
//   /voyages/:id/posts/new       → PostComposerPage
//   /voyages/:id/posts/:postId   → PostDetailPage
//   /voyages/:id/posts/:postId/edit → PostEditorPage
//   /feed              → FeedPage
//   /contacts          → ContactsPage
//   /profile           → ProfilePage
//   /login             → LoginPage   (Phase 8)
//   /signup            → SignupPage  (Phase 8)
// ─────────────────────────────────────────────────────────────────────────────

import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

// Pages — built out progressively through Phase 2–8
// All lazy so each route chunk is loaded on demand
const VoyagesPage      = lazy(() => import('@/pages/VoyagesPage'))
const VoyageDetailPage = lazy(() => import('@/pages/VoyageDetailPage'))
const VoyageEditorPage = lazy(() => import('@/pages/VoyageEditorPage'))
const PostComposerPage = lazy(() => import('@/pages/PostComposerPage'))
const PostEditorPage   = lazy(() => import('@/pages/PostEditorPage'))
const PostDetailPage   = lazy(() => import('@/pages/PostDetailPage'))
// FeedPage / ContactsPage / ProfilePage imported here once they are
// refactored into self-fetching pages (Phase 2–6).
const NotFound         = lazy(() => import('@/sections/NotFound'))

export const router = createBrowserRouter([
  // Root redirect
  { path: '/', element: <Navigate to="/voyages" replace /> },

  // Voyages
  { path: '/voyages',      element: <VoyagesPage /> },
  { path: '/voyages/new',  element: <VoyageEditorPage /> },
  // VoyageDetailPage requires data props from the App shell during migration.
  // This route stub will be updated when App fully switches to RouterProvider.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { path: '/voyages/:voyageId',      element: <VoyageDetailPage {...({} as any)} /> },
  { path: '/voyages/:voyageId/edit', element: <VoyageEditorPage /> },

  // Posts (nested under a voyage)
  { path: '/voyages/:voyageId/posts/new',             element: <PostComposerPage /> },
  { path: '/voyages/:voyageId/posts/:postId',         element: <PostDetailPage /> },
  { path: '/voyages/:voyageId/posts/:postId/edit',    element: <PostEditorPage /> },

  // Top-level pages
  // FeedPage / ContactsPage / ProfilePage still carry legacy prop requirements.
  // Phase 2–6 will refactor them into self-fetching React Query pages.
  // Until then the router uses inline stubs (router isn't live yet anyway).
  { path: '/feed',     element: <div /> },
  { path: '/contacts', element: <div /> },
  { path: '/profile',  element: <div /> },

  // 404
  { path: '*', element: <NotFound onNav={() => window.location.replace('/voyages')} /> },
])
