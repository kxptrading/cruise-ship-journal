// ─────────────────────────────────────────────────────────────────────────────
// App.tsx — Root application component
//
// Responsible for:
//   • Auth session lifecycle + theme persistence
//   • Responsive layout flags
//   • Section routing + navigation state
//   • Toast notifications
//   • Wiring the useVoyageData hook into the section renderer
//
// All Supabase data loading and write-through lives in useVoyageData.
// All DB ↔ app shape conversion lives in lib/converters.ts.
//
// DATA FLOW OVERVIEW:
//   useVoyageData  →  data / update()  →  passed as props to legacy sections
//   React Query hooks (features/*/hooks.ts)  →  used directly by new pages
//
// MIGRATION STATUS: The app is in a dual-layer transition.
//   • New pages (/voyages, /feed, /friends) use React Query and are self-fetching.
//   • Legacy sections (daily log, food, packing, etc.) still receive `data` and
//     `update` props from this root via VoyageDetailPage. Each section will be
//     migrated to React Query in future phases.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig, useScroll } from 'framer-motion'
import { CREAM, NAVY, BP } from './constants'
import { WCtx, VoyageCtx, UserCtx, IconPackCtx, useWindowSize, type IconPack } from './context'
import { applyTheme, getSavedTheme } from './themes'
import { supabase } from './lib/supabase'
import { useVoyageData } from './hooks/useVoyageData'
import { useBreakpoint } from './hooks/useBreakpoint'
import { PAGE_TRANSITION } from './lib/motion'
import Sidebar        from './components/Sidebar'
import TopNav         from './components/TopNav'
import BottomNav      from './components/BottomNav'
import AuthScreen     from './components/AuthScreen'
import ErrorBoundary  from './components/ErrorBoundary'
import { Toast }      from './components/ui'
import Footer         from './components/Footer'
import SyncStatusPill from './components/SyncStatusPill'
import OfflineBanner  from './components/OfflineBanner'
import { useOnlineStatus }  from './hooks/useOnlineStatus'
import { useSyncStatus }    from './hooks/useSyncStatus'
import { useUnreadCounts }  from './hooks/useUnreadCounts'
import { processSyncQueue } from './services/syncService'
import { retryFailed }      from './db/syncQueue'
// Section components — all lazy-loaded so the initial bundle is just the shell
const Dashboard        = lazy(() => import('./pages/DashboardPage'))
const Feed             = lazy(() => import('./pages/FeedPage'))
const DayDetail        = lazy(() => import('./sections/DayDetail'))
const VoyageProfile    = lazy(() => import('./features/voyages/VoyageProfile'))
// VoyageDetails / Itinerary / DailyLog etc. are no longer top-level routes —
// they are tabs inside VoyageDetailPage. Lazy imports kept for VoyageDetailPage.
const VoyageDetails    = lazy(() => import('./features/voyages/VoyageForm'))
const Friends          = lazy(() => import('./pages/ContactsPage'))
const Chat             = lazy(() => import('./sections/Chat'))
const UserProfile      = lazy(() => import('./pages/ProfilePage'))
const DesignSystem     = lazy(() => import('./sections/DesignSystem'))
const NotFound         = lazy(() => import('./sections/NotFound'))
const LoginPage        = lazy(() => import('./pages/LoginPage'))
const SignupPage       = lazy(() => import('./pages/SignupPage'))
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'))
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'))
const VoyagesPage      = lazy(() => import('./pages/VoyagesPage'))
const GalleryPage      = lazy(() => import('./pages/GalleryPage'))
const SearchPage       = lazy(() => import('./pages/SearchPage'))
const VoyageEditorPage = lazy(() => import('./pages/VoyageEditorPage'))
const VoyageDetailPage = lazy(() => import('./pages/VoyageDetailPage'))
const PostComposerPage = lazy(() => import('./pages/PostComposerPage'))
const PostEditorPage   = lazy(() => import('./pages/PostEditorPage'))
const PostDetailPage   = lazy(() => import('./pages/PostDetailPage'))
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'))
const AdminPage        = lazy(() => import('./pages/AdminPage'))
// Legal / help pages — all lazy-loaded; accessible to auth and non-auth users
const TermsPage              = lazy(() => import('./pages/legal/TermsPage'))
const PrivacyPage            = lazy(() => import('./pages/legal/PrivacyPage'))
const CookiesPage            = lazy(() => import('./pages/legal/CookiesPage'))
const AcceptableUsePage      = lazy(() => import('./pages/legal/AcceptableUsePage'))
const CommunityGuidelinesPage = lazy(() => import('./pages/legal/CommunityGuidelinesPage'))
const ContentPolicyPage      = lazy(() => import('./pages/legal/ContentPolicyPage'))
const HelpPage               = lazy(() => import('./pages/HelpPage'))
const SafetyPage             = lazy(() => import('./pages/SafetyPage'))
const DeleteAccountPage      = lazy(() => import('./pages/DeleteAccountPage'))
const AccessibilityPage      = lazy(() => import('./pages/AccessibilityPage'))
const FamilyPage             = lazy(() => import('./pages/FamilyPage'))
const ContactPage            = lazy(() => import('./pages/ContactPage'))
const LegalShell             = lazy(() => import('./pages/legal/LegalShell'))
import type { Session } from '@supabase/supabase-js'
import { useIsAdmin } from './features/safety/hooks'

// All valid section IDs — anything else renders NotFound
const KNOWN_SECTIONS = new Set([
  'feed', 'profile', 'voyage', 'itinerary', 'daily', 'food', 'dining',
  'entertainment', 'foodfav', 'budget', 'shopping', 'highlights', 'packing',
  'notes', 'friends', 'chat', 'userprofile', 'design-system',
])

// Minimal loading shimmer shown while a lazy section chunk loads
function SectionLoader() {
  return (
    <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[80, 200, 140, 200].map((h, i) => (
        <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 14 }} />
      ))}
    </div>
  )
}

// ── Voyage ticker label helper ────────────────────────────────────────────────
// Appends 'T00:00:00' so the Date constructor treats the ISO string as local
// time rather than UTC midnight (which shifts dates by ±hours on most systems).
function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Builds the readable label shown in the Sidebar TickerText.
// The dot separator ( · ) gives clear visual hierarchy between the name and dates.
function buildVoyageLabel(name: string | null | undefined, from: string | null | undefined, to: string | null | undefined, description?: string | null): string {
  const n = name || ''
  const d = from && to ? `${fmtDate(from)} – ${fmtDate(to)}`
          : from       ? `From ${fmtDate(from)}`
          : to         ? `Until ${fmtDate(to)}`
          : ''
  const base = d ? `${n}  ·  ${d}` : n
  return description?.trim() ? `${base}  -  ${description.trim()}` : base
}

// Shape passed from Feed's onViewProfile into Friends as initialFriend
interface FeedFriend {
  requestId:   string
  userId:      string
  displayName: string
  email:       string
  avatarUrl:   string
}

interface ToastState {
  message: string
  visible: boolean
}

export default function App() {
  // ── Responsive layout flags ─────────────────────────────────────────────────
  // winW feeds the WCtx context so any component can react to window size without
  // prop-drilling. bp is a categorical breakpoint enum ('mobile' | 'tablet' | 'desktop').
  const winW      = useWindowSize()
  const bp        = useBreakpoint()
  const isMobile  = bp === 'mobile'
  const isOverlay = isMobile   // sidebar becomes a drawer only on mobile

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [session,     setSession]     = useState<Session | null>(null)
  // authChecked gates the render: we show a spinner until we know the auth state.
  // Without this gate the login screen would flash briefly on page load even for
  // authenticated users (Supabase getSession is async).
  const [authChecked, setAuthChecked] = useState<boolean>(false)

  // ── Theme ───────────────────────────────────────────────────────────────────
  // getSavedTheme reads localStorage synchronously, so the initial state is
  // always the persisted value — no flash of default theme on mount.
  const [theme, setTheme] = useState<string>(getSavedTheme)

  // ── Icon pack ────────────────────────────────────────────────────────────────
  const [iconPack, setIconPack] = useState<IconPack>(
    () => (localStorage.getItem('csj-icon-pack') as IconPack | null) ?? 'fluent'
  )

  const switchIconPack = (pack: IconPack) => {
    localStorage.setItem('csj-icon-pack', pack)
    setIconPack(pack)
  }

  // ── Age gate — null means not set, treated as adult ─────────────────────────
  // The age field comes from the user's profile in Supabase. null means the user
  // has never set their age, and we default to showing adult content (budget tab).
  const [userAge, setUserAge] = useState<number | null>(null)
  const isAdult = userAge === null || userAge >= 18

  // Apply the persisted theme immediately on first render (localStorage fallback)
  useEffect(() => { applyTheme(theme) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchTheme = (id: string) => {
    applyTheme(id)
    setTheme(id)
    // Also persist to the DB so the theme roams across devices.
    const uid = session?.user?.id
    if (uid) supabase.from('profiles').update({ theme: id }).eq('user_id', uid).then()
  }

  // ── Navigation state ────────────────────────────────────────────────────────
  const navigate     = useNavigate()
  const location     = useLocation()
  // Derive section from URL path: /daily → 'daily', / → 'dashboard'
  const section      = location.pathname.slice(1) || 'dashboard'

  const [selectedDay,  setSelectedDay]  = useState<number | null>(null)
  const [dailyJumpDay, setDailyJumpDay] = useState<number | null>(null)
  const [sidebarOpen,  setSidebarOpen]  = useState<boolean>(false)
  const [feedFriend,   setFeedFriend]   = useState<FeedFriend | null>(null)

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toast, setToast]   = useState<ToastState>({ message: '', visible: false })
  // toastTimer ref lets us clear a previous timeout if a new toast fires before
  // the old one hides. Without this a rapid sequence of toasts would race.
  const toastTimer           = useRef<number | null>(null)

  const showToast = (message: string) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    setToast({ message, visible: true })
    toastTimer.current = window.setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  // ── Auth session lifecycle ──────────────────────────────────────────────────
  // getSession() runs once on mount to restore the persisted session from storage.
  // onAuthStateChange() then keeps the session state in sync for the entire
  // lifetime of the tab (sign-in from another tab, token refresh, sign-out, etc.).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthChecked(true)
      // Load theme from DB — applyTheme() also writes localStorage immediately
      // so subsequent loads use the correct theme before this resolves (no flash).
      if (s?.user?.id) {
        supabase
          .from('profiles')
          .select('theme, age')
          .eq('user_id', s.user.id)
          .maybeSingle()
          .then((res) => {
            const d = res.data as { theme?: string | null; age?: number | null } | null
            if (d?.theme) { applyTheme(d.theme); setTheme(d.theme) }
            if (d?.age != null) setUserAge(d.age)
          })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // Clear cached voyage ID on sign-in so a different user on the same
      // device never accidentally loads another user's voyage.
      if (event === 'SIGNED_IN') localStorage.removeItem('csj-activeVoyageId')
      // PASSWORD_RECOVERY fires when the user clicks the reset link in their email.
      // Navigate them to the set-new-password form before updating session state.
      if (event === 'PASSWORD_RECOVERY') navigate('/update-password')
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Auto-close sidebar when viewport widens past tablet breakpoint ──────────
  useEffect(() => {
    if (!isOverlay) setSidebarOpen(false)
  }, [isOverlay])

  // ── Scroll to top on every route change ──────────────────────────────────────
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [location.pathname])

  // ── Offline / sync status ────────────────────────────────────────────────────
  const isOnline   = useOnlineStatus()
  const syncStatus = useSyncStatus()

  // Flush the sync queue whenever the device comes back online.
  useEffect(() => {
    if (isOnline) processSyncQueue().catch(() => {})
  }, [isOnline])

  // ── Data layer ──────────────────────────────────────────────────────────────
  const {
    data,
    loaded,
    voyageId,
    allVoyages,
    update,
    switchVoyage: switchVoyageData,
    createVoyage: createVoyageData,
    handleCoverPhotoChange,
  } = useVoyageData({ session, showToast })

  // ── Admin status ────────────────────────────────────────────────────────────
  const { data: isAdmin } = useIsAdmin()

  // ── Notification badges ─────────────────────────────────────────────────────
  const unread = useUnreadCounts()
  const navBadges: Record<string, number> = {
    chat: unread.chat,
    feed: unread.feed ? 1 : 0,
  }

  // ── URL-driven voyage switch ────────────────────────────────────────────────
  // When the user navigates to /voyages/:id, load that voyage's data even if
  // a different voyage was previously active in localStorage.
  //
  // WHY: Deep-linking (e.g. someone shares a URL to a specific voyage) must work.
  // The regex captures the first path segment after /voyages/ and ignores
  // sub-routes like /voyages/:id/posts/:postId.
  //
  // We only trigger switchVoyageData if the URL ID genuinely differs from what is
  // currently loaded — avoids an infinite re-load loop when the effect fires after
  // switchVoyageData itself updates voyageId.
  useEffect(() => {
    const match    = location.pathname.match(/^\/voyages\/([^/]+?)(?:\/|$)/)
    const urlId    = match?.[1]
    const isNew    = urlId === 'new'
    if (urlId && !isNew && voyageId && urlId !== voyageId) {
      switchVoyageData(urlId)
      setSelectedDay(null)
      setDailyJumpDay(null)
    }
  }, [location.pathname, voyageId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap switchVoyage (used by VoyageProfile voyage-switcher) to also navigate home
  const switchVoyage = (newId: string) => {
    switchVoyageData(newId)
    navigate('/')
    setSelectedDay(null)
    setDailyJumpDay(null)
  }

  // Wrap createVoyage to inject session.user.id
  // The session guard (!) is safe here because createVoyage is only callable
  // when a session exists (the !session render branch returns early above).
  const createVoyage = async (partial: Record<string, unknown> = {}): Promise<void> => {
    await createVoyageData(session!.user.id, partial)
  }

  // ── Section completion status ───────────────────────────────────────────────
  // A Set of section IDs that have meaningful data — used by Sidebar (dots)
  // and Feed (journal completion score).
  //
  // useMemo is important here: `data` is a stable object reference from
  // useVoyageData, so this recalculates only when data actually changes.
  const sectionStatus = useMemo(() => {
    const has = new Set<string>()
    if (data.voyage.shipName || data.voyage.cruiseLine || data.voyage.departureDate) has.add('voyage')
    if (data.itinerary.length > 0) has.add('itinerary')
    if (data.dailyLogs.some(d => d.highlights || d.bestMoment || d.activity)) has.add('daily')
    if (data.foodLogs.length > 0) has.add('food')
    if (data.diningLog.length > 0) has.add('dining')
    if (data.entertainmentLog.length > 0) has.add('entertainment')
    if (Object.values(data.foodFav).some(v => v)) has.add('foodfav')
    if (data.budget.budget || data.budget.items.length > 0) has.add('budget')
    if (data.shopping.items.length > 0) has.add('shopping')
    if (Object.values(data.highlights).some(v => v)) has.add('highlights')
    if (Object.values(data.packing).flat().length > 0) has.add('packing')
    if (data.notes.some(n => n.content || n.title)) has.add('notes')
    return has
  }, [data])

  // ── Navigation handler ──────────────────────────────────────────────────────
  // Journal section IDs (daily, budget, food, etc.) no longer have top-level
  // routes — they are tabs inside VoyageDetailPage. When navClick receives one
  // of these IDs, redirect to /voyages/:id?tab=<section> so the correct tab
  // opens. Fall back to /voyages if voyageId isn't available yet.
  const JOURNAL_TABS = new Set([
    'daily','itinerary','food','dining','entertainment',
    'foodfav','budget','shopping','highlights','packing','notes','voyage',
  ])

  const navClick = (id: string) => {
    if (id === 'dashboard') {
      navigate('/')
    } else if (JOURNAL_TABS.has(id) && voyageId) {
      // Map 'voyage' (old Voyage Details route) to the itinerary tab
      const tab = id === 'voyage' ? 'itinerary' : id
      navigate(`/voyages/${voyageId}?tab=${tab}`)
    } else if (JOURNAL_TABS.has(id)) {
      navigate('/voyages')
    } else {
      navigate('/' + id)
    }
    setSelectedDay(null)
    if (id !== 'daily') setDailyJumpDay(null)
    if (isOverlay) setSidebarOpen(false)
  }

  // ── Layout values ───────────────────────────────────────────────────────────
  const baseFontSize = isMobile ? 15 : bp === 'tablet' ? 15.5 : 16
  const mainPad      = isMobile ? '20px 12px' : bp === 'tablet' ? '32px 28px' : '44px 52px'
  // Extra bottom clearance on mobile so content isn't hidden behind the BottomNav.
  const mainPadBottom = isMobile ? '80px' : '48px'

  // ── Scroll tracking — fed into VoyageHero for parallax/fade ────────────────
  // useScroll with a container ref tracks the overflow-y scroll on <main>, not
  // the window scroll. This is necessary because <main> is the scrolling element
  // (not the body) in this layout.
  const mainRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll({ container: mainRef })

  // ── Loading / auth screens ──────────────────────────────────────────────────
  // Three progressive gates before the full app shell renders:
  //   1. authChecked — waiting for Supabase to restore the session from storage.
  //   2. !session    — user is not logged in; show auth routes only.
  //   3. !loaded || !voyageId — auth is confirmed but voyage data hasn't loaded yet.
  if (!authChecked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, fontFamily: 'Georgia,serif' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.svg" alt="Deck Days" style={{ height: 64, width: 'auto', display: 'block', margin: '0 auto 16px', opacity: 0.9 }} />
        <div style={{ color: NAVY, fontSize: 18 }}>Loading...</div>
      </div>
    </div>
  )

  if (!session) return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/signup"          element={<SignupPage />} />
        <Route path="/reset"           element={<ResetPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        {/* Legal / help pages — accessible without authentication */}
        <Route path="/legal/terms"               element={<LegalShell><TermsPage /></LegalShell>} />
        <Route path="/legal/privacy"             element={<LegalShell><PrivacyPage /></LegalShell>} />
        <Route path="/legal/cookies"             element={<LegalShell><CookiesPage /></LegalShell>} />
        <Route path="/legal/acceptable-use"      element={<LegalShell><AcceptableUsePage /></LegalShell>} />
        <Route path="/legal/community-guidelines" element={<LegalShell><CommunityGuidelinesPage /></LegalShell>} />
        <Route path="/legal/content-policy"      element={<LegalShell><ContentPolicyPage /></LegalShell>} />
        <Route path="/help"            element={<LegalShell><HelpPage /></LegalShell>} />
        <Route path="/safety"          element={<LegalShell><SafetyPage /></LegalShell>} />
        <Route path="/delete-account"  element={<LegalShell><DeleteAccountPage /></LegalShell>} />
        <Route path="/accessibility"   element={<LegalShell><AccessibilityPage /></LegalShell>} />
        <Route path="/family-safety"   element={<LegalShell><FamilyPage /></LegalShell>} />
        <Route path="/contact"         element={<LegalShell><ContactPage /></LegalShell>} />
        <Route path="*"                element={<LoginPage />} />
      </Routes>
    </Suspense>
  )

  // Legal/help routes bypass the voyage-loading gate — they need no voyage data
  const STATIC_PATHS = new Set(['/help','/safety','/delete-account','/accessibility','/family-safety','/contact'])
  const isStaticRoute = location.pathname.startsWith('/legal') || STATIC_PATHS.has(location.pathname)

  if (!loaded || !voyageId) {
    if (isStaticRoute) return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/legal/terms"               element={<TermsPage />} />
          <Route path="/legal/privacy"             element={<PrivacyPage />} />
          <Route path="/legal/cookies"             element={<CookiesPage />} />
          <Route path="/legal/acceptable-use"      element={<AcceptableUsePage />} />
          <Route path="/legal/community-guidelines" element={<CommunityGuidelinesPage />} />
          <Route path="/legal/content-policy"      element={<ContentPolicyPage />} />
          <Route path="/help"           element={<HelpPage />} />
          <Route path="/safety"         element={<SafetyPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />
          <Route path="/accessibility"  element={<AccessibilityPage />} />
          <Route path="/family-safety"  element={<FamilyPage />} />
          <Route path="/contact"        element={<ContactPage />} />
        </Routes>
      </Suspense>
    )
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, fontFamily: 'Georgia,serif' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/logo.svg" alt="Deck Days" style={{ height: 64, width: 'auto', display: 'block', margin: '0 auto 16px', opacity: 0.9 }} />
          <div style={{ color: NAVY, fontSize: 18 }}>Loading your voyage journal...</div>
        </div>
      </div>
    )
  }

  // ── Layout ──────────────────────────────────────────────────────────────────
  // Three React contexts are provided here at the root level:
  //   VoyageCtx  — the currently active voyageId (string), used by feature hooks.
  //   UserCtx    — the current user's ID, consumed by all React Query hooks.
  //   WCtx       — the window inner-width in px, used by sections for responsive layout.
  //
  // MotionConfig reducedMotion="user" respects the OS-level 'reduce motion'
  // accessibility setting by automatically disabling Framer Motion animations.
  return (
    <MotionConfig reducedMotion="user">
    <IconPackCtx.Provider value={iconPack}>
    <VoyageCtx.Provider value={voyageId}>
    <UserCtx.Provider value={session?.user?.id ?? null}>
    <WCtx.Provider value={winW}>
      <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', background: CREAM, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', fontSize: baseFontSize }}>

        <TopNav
            section={section}
            onNav={navClick}
            isOverlay={isOverlay}
            isMobile={isMobile}
            onMenuOpen={() => setSidebarOpen(true)}
            voyageLabel={(() => {
              // Only show the voyage name when the user is on a specific voyage
              // page (/voyages/:id). Everywhere else show the welcome message.
              const onVoyagePage = /^\/voyages\/[^/]+/.test(location.pathname) &&
                                   !location.pathname.endsWith('/new')
              if (!onVoyagePage) return undefined
              const row = allVoyages.find(v => v.id === voyageId)
              return buildVoyageLabel(
                row?.ship_name ?? data.voyage.shipName,
                row?.departure_date ?? data.voyage.departureDate,
                row?.return_date    ?? data.voyage.returnDate,
                data.voyage.cruiseDescription,
              ) || undefined
            })()}
            badges={navBadges}
          />

        <OfflineBanner visible={!isOnline} />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            section={section}
            onNav={navClick}
            bp={bp}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            user={session?.user}
            onSignOut={() => supabase.auth.signOut()}
            voyageName={(() => {
              const row = allVoyages.find(v => v.id === voyageId)
              return buildVoyageLabel(
                row?.ship_name ?? data.voyage.shipName,
                row?.departure_date ?? data.voyage.departureDate,
                row?.return_date    ?? data.voyage.returnDate,
                data.voyage.cruiseDescription,
              )
            })()}
            voyageCount={allVoyages.length}
            sectionStatus={sectionStatus}
            isAdult={isAdult}
            isAdmin={isAdmin === true}
            badges={navBadges}
          />

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* <main> is the sole overflow-y scroll container.
              Its ref feeds the Framer Motion useScroll hook for parallax effects.
              overflow-x: hidden prevents horizontal scroll from animated page transitions. */}
          <main ref={mainRef} role="main" aria-label="Main content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* AnimatePresence mode="wait" ensures the exiting page fully unmounts
                before the entering page begins animating. The key is the full
                pathname so sub-route changes also trigger the transition. */}
            <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_TRANSITION}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ padding: mainPad, paddingBottom: mainPadBottom, flex: 1 }}
            >
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* ErrorBoundary is keyed by pathname so a crash in one section
                is isolated and cleared when navigating away. */}
            <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<SectionLoader />}>
              <Routes>
                {/* ── New page-based routes (Phase 2+) ───────────────────── */}
                <Route path="/voyages"             element={<VoyagesPage onSwitch={switchVoyage} />} />
                <Route path="/voyages/new"         element={<VoyageEditorPage />} />
                <Route path="/voyages/:voyageId/edit"              element={<VoyageEditorPage />} />
                <Route path="/voyages/:voyageId/posts/new"         element={<PostComposerPage />} />
                <Route path="/voyages/:voyageId/posts/:postId/edit" element={<PostEditorPage />} />
                <Route path="/voyages/:voyageId/posts/:postId"     element={<PostDetailPage />} />
                {/* VoyageDetailPage receives data+update so it can pass them to
                    legacy journal-section tabs without those tabs needing to
                    re-fetch data they already have from useVoyageData. */}
                <Route path="/voyages/:voyageId"   element={
                  <VoyageDetailPage
                    data={data}
                    update={update}
                    onNav={navClick}
                    showToast={showToast}
                    isAdult={isAdult}
                  />
                } />

                {/* ── Legacy section routes (preserved during migration) ── */}
                <Route path="/" element={
                  selectedDay === null
                    ? <Dashboard
                        voyage={data.voyage} itinerary={data.itinerary}
                        dailyLogs={data.dailyLogs} budget={data.budget}
                        packing={data.packing} foodLogs={data.foodLogs}
                        diningLog={data.diningLog} sectionStatus={sectionStatus}
                        onChange={v => update('dailyLogs', v)} onNav={navClick}
                        onSwitch={switchVoyage}
                        showToast={showToast} onViewDay={setSelectedDay}
                        scrollY={scrollY}
                        onViewProfile={(author) => {
                          setFeedFriend({ userId: author.userId ?? '', displayName: author.name, avatarUrl: author.avatarUrl, requestId: '', email: '' })
                          navClick('friends')
                        }}
                      />
                    : <DayDetail dayIndex={selectedDay} log={data.dailyLogs[selectedDay] || {}} itinerary={data.itinerary} onBack={() => setSelectedDay(null)} onEdit={() => { setDailyJumpDay(selectedDay); setSelectedDay(null); navClick('daily') }} />
                } />
                <Route path="/feed"    element={<Feed />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/search"  element={<SearchPage />} />
                <Route path="/profile"       element={<VoyageProfile voyage={data.voyage} allVoyages={allVoyages} voyageId={voyageId} session={session} onSwitch={switchVoyage} onCreate={createVoyage} onCoverPhotoChange={handleCoverPhotoChange} />} />
                {/* Legacy section routes — redirect to /voyages so old bookmarks don't 404 */}
                {['voyage','itinerary','daily','food','dining','entertainment','foodfav','budget','shopping','highlights','packing','notes'].map(path => (
                  <Route key={path} path={`/${path}`} element={<Navigate to="/voyages" replace />} />
                ))}
                {/* /friends and /contacts both route to the new ContactsPage */}
                <Route path="/friends"  element={<Friends />} />
                <Route path="/contacts" element={<Friends />} />
                <Route path="/chat"          element={<Chat />} />
                <Route path="/userprofile"   element={<UserProfile session={session} allVoyages={allVoyages} voyage={data.voyage} onNav={navClick} theme={theme} onThemeChange={switchTheme} iconPack={iconPack} onIconPackChange={switchIconPack} />} />
                <Route path="/admin"             element={<AdminPage />} />
                <Route path="/admin/reports"    element={<AdminReportsPage />} />
                {/* Legal / help pages — inside app shell for authenticated users */}
                <Route path="/legal/terms"               element={<TermsPage />} />
                <Route path="/legal/privacy"             element={<PrivacyPage />} />
                <Route path="/legal/cookies"             element={<CookiesPage />} />
                <Route path="/legal/acceptable-use"      element={<AcceptableUsePage />} />
                <Route path="/legal/community-guidelines" element={<CommunityGuidelinesPage />} />
                <Route path="/legal/content-policy"      element={<ContentPolicyPage />} />
                <Route path="/help"           element={<HelpPage />} />
                <Route path="/safety"         element={<SafetyPage />} />
                <Route path="/delete-account" element={<DeleteAccountPage />} />
                <Route path="/accessibility"  element={<AccessibilityPage />} />
                <Route path="/family-safety"  element={<FamilyPage />} />
                <Route path="/contact"        element={<ContactPage />} />
                <Route path="/design-system"   element={<DesignSystem />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="*"                element={<NotFound onNav={navClick} />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
            </div>
            </motion.div>
            </AnimatePresence>
            {/* Footer scrolls with content — only on desktop (mobile uses BottomNav) */}
            {!isMobile && <Footer />}
          </main>
          </div>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
      <SyncStatusPill
        syncStatus={syncStatus}
        isMobile={isMobile}
        onSync={() => processSyncQueue().then(() => syncStatus.refresh())}
        onRetry={() => retryFailed().then(() => processSyncQueue()).then(() => syncStatus.refresh())}
      />
      {isMobile && (
        <BottomNav
          section={section}
          onNav={navClick}
          onMenuOpen={() => setSidebarOpen(true)}
          badges={navBadges}
        />
      )}
    </WCtx.Provider>
    </UserCtx.Provider>
    </VoyageCtx.Provider>
    </IconPackCtx.Provider>
    </MotionConfig>
  )
}
