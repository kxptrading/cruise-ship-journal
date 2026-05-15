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
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig, useScroll } from 'framer-motion'
import { CREAM, NAVY, BP } from './constants'
import { WCtx, VoyageCtx, UserCtx, useWindowSize } from './context'
import { applyTheme, getSavedTheme } from './themes'
import { supabase } from './lib/supabase'
import { useVoyageData } from './hooks/useVoyageData'
import { useBreakpoint } from './hooks/useBreakpoint'
import { PAGE_TRANSITION } from './lib/motion'
import Sidebar      from './components/Sidebar'
import TopNav       from './components/TopNav'
import BottomNav    from './components/BottomNav'
import AuthScreen   from './components/AuthScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { Toast }    from './components/ui'
// Section components — all lazy-loaded so the initial bundle is just the shell
const Dashboard        = lazy(() => import('./pages/DashboardPage'))
const Feed             = lazy(() => import('./pages/FeedPage'))
const DayDetail        = lazy(() => import('./sections/DayDetail'))
const VoyageProfile    = lazy(() => import('./features/voyages/VoyageProfile'))
const VoyageDetails    = lazy(() => import('./features/voyages/VoyageForm'))
const Itinerary        = lazy(() => import('./features/voyages/ItineraryEditor'))
const DailyLog         = lazy(() => import('./sections/DailyLog'))
const FoodLog          = lazy(() => import('./sections/FoodLog'))
const DiningLog        = lazy(() => import('./sections/DiningLog'))
const EntertainmentLog = lazy(() => import('./sections/EntertainmentLog'))
const FoodFavourites   = lazy(() => import('./sections/FoodFavourites'))
const BudgetTracker    = lazy(() => import('./sections/BudgetTracker'))
const ShoppingLog      = lazy(() => import('./sections/ShoppingLog'))
const Highlights       = lazy(() => import('./sections/Highlights'))
const PackingList      = lazy(() => import('./sections/PackingList'))
const Notes            = lazy(() => import('./sections/Notes'))
const Friends          = lazy(() => import('./pages/ContactsPage'))
const Chat             = lazy(() => import('./sections/Chat'))
const UserProfile      = lazy(() => import('./pages/ProfilePage'))
const DesignSystem     = lazy(() => import('./sections/DesignSystem'))
const NotFound         = lazy(() => import('./sections/NotFound'))
const VoyagesPage      = lazy(() => import('./pages/VoyagesPage'))
const VoyageEditorPage = lazy(() => import('./pages/VoyageEditorPage'))
const VoyageDetailPage = lazy(() => import('./pages/VoyageDetailPage'))
const PostComposerPage = lazy(() => import('./pages/PostComposerPage'))
const PostEditorPage   = lazy(() => import('./pages/PostEditorPage'))
const PostDetailPage   = lazy(() => import('./pages/PostDetailPage'))
import type { Session } from '@supabase/supabase-js'

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
  const winW      = useWindowSize()
  const bp        = useBreakpoint()
  const isMobile  = bp === 'mobile'
  const isOverlay = isMobile   // sidebar becomes a drawer only on mobile

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [session,     setSession]     = useState<Session | null>(null)
  const [authChecked, setAuthChecked] = useState<boolean>(false)

  // ── Theme ───────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<string>(getSavedTheme)

  // ── Age gate — null means not set, treated as adult ─────────────────────────
  const [userAge, setUserAge] = useState<number | null>(null)
  const isAdult = userAge === null || userAge >= 18

  // Apply the persisted theme immediately on first render (localStorage fallback)
  useEffect(() => { applyTheme(theme) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchTheme = (id: string) => {
    applyTheme(id)
    setTheme(id)
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
  const toastTimer           = useRef<number | null>(null)

  const showToast = (message: string) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    setToast({ message, visible: true })
    toastTimer.current = window.setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  // ── Auth session lifecycle ──────────────────────────────────────────────────
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
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Auto-close sidebar when viewport widens past tablet breakpoint ──────────
  useEffect(() => {
    if (!isOverlay) setSidebarOpen(false)
  }, [isOverlay])

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

  // Wrap switchVoyage to also reset navigation state
  const switchVoyage = (newId: string) => {
    switchVoyageData(newId)
    navigate('/')
    setSelectedDay(null)
    setDailyJumpDay(null)
  }

  // Wrap createVoyage to inject session.user.id
  const createVoyage = async (partial: Record<string, unknown> = {}): Promise<void> => {
    await createVoyageData(session!.user.id, partial)
  }

  // ── Section completion status ───────────────────────────────────────────────
  // A Set of section IDs that have meaningful data — used by Sidebar (dots)
  // and Feed (journal completion score).
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
  const navClick = (id: string) => {
    if (id === 'dashboard') navigate('/')
    else navigate('/' + id)
    setSelectedDay(null)
    if (id !== 'daily') setDailyJumpDay(null)
    if (isOverlay) setSidebarOpen(false)
  }

  // ── Layout values ───────────────────────────────────────────────────────────
  const baseFontSize = isMobile ? 15 : bp === 'tablet' ? 15.5 : 16
  const mainPad      = isMobile ? '20px 12px' : bp === 'tablet' ? '32px 28px' : '44px 52px'
  // Extra bottom clearance on mobile so content isn't hidden behind the BottomNav
  const mainPadBottom = isMobile ? '80px' : mainPad.split(' ')[0]

  // ── Scroll tracking — fed into VoyageHero for parallax/fade ────────────────
  const mainRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll({ container: mainRef })

  // ── Loading / auth screens ──────────────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, fontFamily: 'Georgia,serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚓</div>
        <div style={{ color: NAVY, fontSize: 18 }}>Loading...</div>
      </div>
    </div>
  )

  if (!session) return <AuthScreen />

  if (!loaded || !voyageId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, fontFamily: 'Georgia,serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚓</div>
        <div style={{ color: NAVY, fontSize: 18 }}>Loading your voyage journal...</div>
      </div>
    </div>
  )

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <MotionConfig reducedMotion="user">
    <VoyageCtx.Provider value={voyageId}>
    <UserCtx.Provider value={session?.user?.id ?? null}>
    <WCtx.Provider value={winW}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: CREAM, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', fontSize: baseFontSize }}>

        <Sidebar
          section={section}
          onNav={navClick}
          bp={bp}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={session?.user}
          onSignOut={() => supabase.auth.signOut()}
          voyageName={data.voyage.shipName}
          voyageCount={allVoyages.length}
          sectionStatus={sectionStatus}
          isAdult={isAdult}
        />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <TopNav
            section={section}
            onNav={navClick}
            isOverlay={isOverlay}
            isMobile={isMobile}
            onMenuOpen={() => setSidebarOpen(true)}
          />

          <main ref={mainRef} role="main" aria-label="Main content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_TRANSITION}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ padding: mainPad, paddingBottom: mainPadBottom }}
            >
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<SectionLoader />}>
              <Routes>
                {/* ── New page-based routes (Phase 2+) ───────────────────── */}
                <Route path="/voyages"             element={<VoyagesPage />} />
                <Route path="/voyages/new"         element={<VoyageEditorPage />} />
                <Route path="/voyages/:voyageId/edit"              element={<VoyageEditorPage />} />
                <Route path="/voyages/:voyageId/posts/new"         element={<PostComposerPage />} />
                <Route path="/voyages/:voyageId/posts/:postId/edit" element={<PostEditorPage />} />
                <Route path="/voyages/:voyageId/posts/:postId"     element={<PostDetailPage />} />
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
                        showToast={showToast} onViewDay={setSelectedDay}
                        scrollY={scrollY}
                        onViewProfile={(author) => {
                          setFeedFriend({ userId: author.userId ?? '', displayName: author.name, avatarUrl: author.avatarUrl, requestId: '', email: '' })
                          navClick('friends')
                        }}
                      />
                    : <DayDetail dayIndex={selectedDay} log={data.dailyLogs[selectedDay] || {}} itinerary={data.itinerary} onBack={() => setSelectedDay(null)} onEdit={() => { setDailyJumpDay(selectedDay); setSelectedDay(null); navClick('daily') }} />
                } />
                <Route path="/feed" element={
                  <Feed
                    voyage={data.voyage} itinerary={data.itinerary}
                    dailyLogs={data.dailyLogs} budget={data.budget}
                    packing={data.packing} foodLogs={data.foodLogs}
                    diningLog={data.diningLog} sectionStatus={sectionStatus}
                    onChange={v => update('dailyLogs', v)} onNav={navClick}
                    showToast={showToast} onViewDay={setSelectedDay}
                    scrollY={scrollY}
                    onViewProfile={(author) => {
                      setFeedFriend({ userId: author.userId ?? '', displayName: author.name, avatarUrl: author.avatarUrl, requestId: '', email: '' })
                      navClick('friends')
                    }}
                  />
                } />
                <Route path="/profile"       element={<VoyageProfile voyage={data.voyage} allVoyages={allVoyages} voyageId={voyageId} session={session} onSwitch={switchVoyage} onCreate={createVoyage} onCoverPhotoChange={handleCoverPhotoChange} />} />
                <Route path="/voyage"        element={<VoyageDetails data={data.voyage} onChange={v => update('voyage', v)} />} />
                <Route path="/itinerary"     element={<Itinerary data={data.itinerary} onChange={v => update('itinerary', v)} />} />
                <Route path="/daily"         element={<DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} voyage={data.voyage} initialDay={dailyJumpDay ?? 0} />} />
                <Route path="/food"          element={<FoodLog data={data.foodLogs} onChange={v => update('foodLogs', v)} />} />
                <Route path="/dining"        element={<DiningLog data={data.diningLog} onChange={v => update('diningLog', v)} />} />
                <Route path="/entertainment" element={<EntertainmentLog data={data.entertainmentLog} onChange={v => update('entertainmentLog', v)} />} />
                <Route path="/foodfav"       element={<FoodFavourites data={data.foodFav} onChange={v => update('foodFav', v)} />} />
                <Route path="/budget"        element={isAdult ? <BudgetTracker data={data.budget} onChange={v => update('budget', v)} /> : <NotFound onNav={navClick} />} />
                <Route path="/shopping"      element={<ShoppingLog data={data.shopping} onChange={v => update('shopping', v)} />} />
                <Route path="/highlights"    element={<Highlights data={data.highlights} onChange={v => update('highlights', v)} />} />
                <Route path="/packing"       element={<PackingList data={data.packing} onChange={v => update('packing', v)} />} />
                <Route path="/notes"         element={<Notes data={data.notes} onChange={v => update('notes', v)} />} />
                <Route path="/friends"       element={<Friends initialFriend={feedFriend} onClearInitialFriend={() => setFeedFriend(null)} />} />
                <Route path="/chat"          element={<Chat />} />
                <Route path="/userprofile"   element={<UserProfile session={session} allVoyages={allVoyages} voyage={data.voyage} onNav={navClick} theme={theme} onThemeChange={switchTheme} onAgeChange={setUserAge} />} />
                <Route path="/design-system" element={<DesignSystem />} />
                <Route path="*"              element={<NotFound onNav={navClick} />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
            </div>
            </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
      {isMobile && (
        <BottomNav
          section={section}
          onNav={navClick}
          onMenuOpen={() => setSidebarOpen(true)}
        />
      )}
    </WCtx.Provider>
    </UserCtx.Provider>
    </VoyageCtx.Provider>
    </MotionConfig>
  )
}
