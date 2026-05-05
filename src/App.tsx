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

import { useState, useEffect, useRef, useMemo } from 'react'
import { CREAM, NAVY, BP } from './constants'
import { WCtx, VoyageCtx, UserCtx, useWindowSize } from './context'
import { applyTheme, getSavedTheme } from './themes'
import { supabase } from './lib/supabase'
import { useVoyageData } from './hooks/useVoyageData'
import Sidebar      from './components/Sidebar'
import TopNav       from './components/TopNav'
import AuthScreen   from './components/AuthScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { Toast }    from './components/ui'
import Feed             from './sections/Feed'
import DayDetail        from './sections/DayDetail'
import VoyageProfile    from './sections/VoyageProfile'
import VoyageDetails    from './sections/VoyageDetails'
import Itinerary        from './sections/Itinerary'
import DailyLog         from './sections/DailyLog'
import FoodLog          from './sections/FoodLog'
import DiningLog        from './sections/DiningLog'
import EntertainmentLog from './sections/EntertainmentLog'
import FoodFavourites   from './sections/FoodFavourites'
import BudgetTracker    from './sections/BudgetTracker'
import ShoppingLog      from './sections/ShoppingLog'
import Highlights       from './sections/Highlights'
import PackingList      from './sections/PackingList'
import Notes            from './sections/Notes'
import Friends          from './sections/Friends'
import Chat             from './sections/Chat'
import UserProfile      from './sections/UserProfile'
import type { Session } from '@supabase/supabase-js'

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
  const isOverlay = winW <= BP.tablet
  const isMobile  = winW < BP.mobile

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
  const [section,      setSection]      = useState<string>('dashboard')
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
    setSection('dashboard')
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
    setSection(id)
    setSelectedDay(null)
    if (id !== 'daily') setDailyJumpDay(null)
    if (isOverlay) setSidebarOpen(false)
  }

  // ── Layout values ───────────────────────────────────────────────────────────
  const baseFontSize = isMobile ? 15 : winW < BP.tablet ? 15.5 : 16
  const mainPad      = isMobile ? '20px 12px' : winW < BP.tablet ? '32px 28px' : '44px 52px'

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
    <VoyageCtx.Provider value={voyageId}>
    <UserCtx.Provider value={session?.user?.id ?? null}>
    <WCtx.Provider value={winW}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: CREAM, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', fontSize: baseFontSize }}>

        <Sidebar
          section={section}
          onNav={navClick}
          isOverlay={isOverlay}
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

          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <div key={section} className="page-in" style={{ padding: mainPad }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <ErrorBoundary>
              {section === 'dashboard' && selectedDay === null && (
                <Feed
                  voyage={data.voyage}
                  itinerary={data.itinerary}
                  dailyLogs={data.dailyLogs}
                  budget={data.budget}
                  packing={data.packing}
                  foodLogs={data.foodLogs}
                  diningLog={data.diningLog}
                  sectionStatus={sectionStatus}
                  onChange={v => update('dailyLogs', v)}
                  onNav={navClick}
                  showToast={showToast}
                  onViewDay={setSelectedDay}
                  onViewProfile={(author) => {
                    setFeedFriend({ userId: author.userId ?? '', displayName: author.name, avatarUrl: author.avatarUrl, requestId: '', email: '' })
                    navClick('friends')
                  }}
                />
              )}
              {section === 'dashboard' && selectedDay !== null && (
                <DayDetail dayIndex={selectedDay} log={data.dailyLogs[selectedDay] || {}} itinerary={data.itinerary} onBack={() => setSelectedDay(null)} onEdit={() => { setDailyJumpDay(selectedDay); setSelectedDay(null); navClick('daily') }} />
              )}
              {section === 'profile'       && <VoyageProfile voyage={data.voyage} allVoyages={allVoyages} voyageId={voyageId} session={session} onSwitch={switchVoyage} onCreate={createVoyage} onCoverPhotoChange={handleCoverPhotoChange} />}
              {section === 'voyage'        && <VoyageDetails data={data.voyage} onChange={v => update('voyage', v)} />}
              {section === 'itinerary'     && <Itinerary data={data.itinerary} onChange={v => update('itinerary', v)} />}
              {section === 'daily'         && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} voyage={data.voyage} initialDay={dailyJumpDay ?? 0} />}
              {section === 'food'          && <FoodLog data={data.foodLogs} onChange={v => update('foodLogs', v)} />}
              {section === 'dining'        && <DiningLog data={data.diningLog} onChange={v => update('diningLog', v)} />}
              {section === 'entertainment' && <EntertainmentLog data={data.entertainmentLog} onChange={v => update('entertainmentLog', v)} />}
              {section === 'foodfav'       && <FoodFavourites data={data.foodFav} onChange={v => update('foodFav', v)} />}
              {section === 'budget'        && isAdult && <BudgetTracker data={data.budget} onChange={v => update('budget', v)} />}
              {section === 'shopping'      && <ShoppingLog data={data.shopping} onChange={v => update('shopping', v)} />}
              {section === 'highlights'    && <Highlights data={data.highlights} onChange={v => update('highlights', v)} />}
              {section === 'packing'       && <PackingList data={data.packing} onChange={v => update('packing', v)} />}
              {section === 'notes'         && <Notes data={data.notes} onChange={v => update('notes', v)} />}
              {section === 'friends'       && <Friends initialFriend={feedFriend} onClearInitialFriend={() => setFeedFriend(null)} />}
              {section === 'chat'          && <Chat />}
              {section === 'userprofile'   && <UserProfile session={session} allVoyages={allVoyages} voyage={data.voyage} onNav={navClick} theme={theme} onThemeChange={switchTheme} onAgeChange={setUserAge} />}
            </ErrorBoundary>
            </div>
            </div>
          </main>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
    </WCtx.Provider>
    </UserCtx.Provider>
    </VoyageCtx.Provider>
  )
}
