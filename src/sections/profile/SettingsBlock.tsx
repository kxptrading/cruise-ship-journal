// ─────────────────────────────────────────────────────────────────────────────
// profile/SettingsBlock.tsx — Settings, export actions, and sign-out
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserId } from '../../context'
import { WHITE, BORDER, NAVY2, MUTED, FONT_DISPLAY, FONT_BODY } from '../../constants'
import FE from '../../components/FE'
import { fetchAllData, exportJournalPdf } from '../../lib/voyageExport'

const ROSE_C = '#F43F5E'
const NAVY_C = '#14293F'
const PLUM_C = '#8B5CF6'
const GOLD_C = '#F59E0B'


async function downloadJSON(userId: string, displayName: string) {
  const data = await fetchAllData(userId)
  const payload = { exportedAt: new Date().toISOString(), user: displayName || 'Unknown', ...data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `cruise-journal-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}



const PRIVACY_KEY = 'csj-feed-public'
function loadPrivacyPref(): boolean {
  try { return JSON.parse(localStorage.getItem(PRIVACY_KEY) ?? 'true') } catch { return true }
}

async function applyPrivacyToDb(userId: string, isPublic: boolean) {
  const { data: voyages } = await supabase.from('voyages').select('id').eq('user_id', userId)
  if (!voyages?.length) return
  const ids = voyages.map((v: { id: string }) => v.id)
  await supabase.from('daily_logs').update({ is_public: isPublic }).in('voyage_id', ids)
}

const NOTIF_KEY      = 'csj-notif-enabled'
const NOTIF_TIME_KEY = 'csj-notif-time'

function loadNotifPref(): boolean {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) ?? 'false') } catch { return false }
}
function loadNotifTime(): string {
  return localStorage.getItem(NOTIF_TIME_KEY) ?? '21:00'
}

let _notifTimer: number | null = null
function scheduleNotif(timeStr: string) {
  if (_notifTimer !== null) { clearTimeout(_notifTimer); _notifTimer = null }
  if (Notification.permission !== 'granted') return

  const [h, m] = timeStr.split(':').map(Number)
  const now    = new Date()
  const fire   = new Date(now)
  fire.setHours(h, m, 0, 0)
  if (fire <= now) fire.setDate(fire.getDate() + 1)

  _notifTimer = window.setTimeout(() => {
    new Notification('Cruise Journal', { body: "Don't forget to log today's adventures! 🚢", icon: '/favicon.svg' })
    scheduleNotif(timeStr)
  }, fire.getTime() - now.getTime())
}

function cancelNotif() {
  if (_notifTimer !== null) { clearTimeout(_notifTimer); _notifTimer = null }
}

// ── SettingsBlock ─────────────────────────────────────────────────────────────

interface RowDef {
  key:     string
  emoji:   string
  color:   string
  title:   string
  sub:     string
  onClick?: () => void
  busy:    boolean
  right:   ReactNode
}

interface Props {
  onSignOut:    () => void
  displayName?: string | null
}

export default function SettingsBlock({ onSignOut, displayName }: Props) {
  const userId = useUserId()

  const [working,      setWorking]      = useState<string | null>(null)
  const [exportErr,    setExportErr]    = useState<string>('')
  const [feedPublic,   setFeedPublic]   = useState<boolean>(() => loadPrivacyPref())
  const [privWorking,  setPrivWorking]  = useState<boolean>(false)
  const [notifOn,      setNotifOn]      = useState<boolean>(() => loadNotifPref())
  const [notifTime,    setNotifTime]    = useState<string>(() => loadNotifTime())
  const [notifPerm,    setNotifPerm]    = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [, setShowTimePicker] = useState<boolean>(false)
  const timeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (notifOn && notifPerm === 'granted') scheduleNotif(notifTime)
    return () => cancelNotif()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePdf = async () => {
    if (!userId || working) return
    setWorking('pdf'); setExportErr('')
    try { await exportJournalPdf(userId, displayName || 'My') }
    catch (e) { setExportErr('Export failed. Please try again.'); console.error(e) }
    finally { setWorking(null) }
  }

  const handleJson = async () => {
    if (!userId || working) return
    setWorking('json'); setExportErr('')
    try { await downloadJSON(userId, displayName || 'Unknown') }
    catch (e) { setExportErr('Download failed. Please try again.'); console.error(e) }
    finally { setWorking(null) }
  }

  const handlePrivacy = async () => {
    if (privWorking || !userId) return
    const next = !feedPublic
    setFeedPublic(next)
    localStorage.setItem(PRIVACY_KEY, JSON.stringify(next))
    setPrivWorking(true)
    try { await applyPrivacyToDb(userId, next) }
    catch (e) { console.error('Privacy update failed:', e) }
    finally { setPrivWorking(false) }
  }

  const handleNotifications = async () => {
    if (notifPerm === 'unsupported') return
    if (!notifOn) {
      let perm = notifPerm
      if (perm === 'default') { perm = await Notification.requestPermission(); setNotifPerm(perm) }
      if (perm !== 'granted') return
      setNotifOn(true)
      localStorage.setItem(NOTIF_KEY, 'true')
      scheduleNotif(notifTime)
      setShowTimePicker(true)
    } else {
      setNotifOn(false)
      setShowTimePicker(false)
      localStorage.setItem(NOTIF_KEY, 'false')
      cancelNotif()
    }
  }

  const handleTimeChange = (newTime: string) => {
    setNotifTime(newTime)
    localStorage.setItem(NOTIF_TIME_KEY, newTime)
    if (notifOn && notifPerm === 'granted') scheduleNotif(newTime)
  }

  const toggle = (on: boolean, color: string) => (
    <div style={{ width: 38, height: 22, borderRadius: 11, flexShrink: 0, background: on ? color : '#D1D5DB', transition: 'background 0.2s', position: 'relative', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
    </div>
  )

  const rows: RowDef[] = [
    { key: 'pdf',     emoji: '📕', color: ROSE_C, title: 'Export all journals',   sub: working === 'pdf'  ? 'Preparing…' : 'Download as PDF',                onClick: handlePdf,          busy: working === 'pdf',  right: null },
    { key: 'json',    emoji: '💾', color: NAVY_C, title: 'Download raw data',     sub: working === 'json' ? 'Preparing…' : 'JSON backup of all journals',    onClick: handleJson,         busy: working === 'json', right: null },
    { key: 'privacy', emoji: '🔒', color: PLUM_C, title: 'Feed Privacy',          sub: privWorking ? 'Updating…' : feedPublic ? 'Friends can see your posts' : 'Only you can see your posts', onClick: handlePrivacy, busy: privWorking, right: toggle(feedPublic, PLUM_C) },
    { key: 'notif',   emoji: '🔔', color: GOLD_C, title: 'Daily Reminder',
      sub: notifPerm === 'unsupported' ? 'Not supported in this browser' : notifPerm === 'denied' ? 'Notifications blocked — check browser settings' : notifOn ? `Reminder set for ${notifTime}` : 'Get a nudge to log your day',
      onClick: notifPerm === 'denied' || notifPerm === 'unsupported' ? undefined : handleNotifications,
      busy: false,
      right: notifPerm === 'denied' || notifPerm === 'unsupported' ? <span style={{ fontSize: 11, color: MUTED }}>N/A</span> : toggle(notifOn, GOLD_C),
    },
  ]

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1 1 0', minWidth: 0 }}>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>YOUR DATA</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Settings & Export</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => (
          <button
            key={r.key}
            onClick={r.onClick}
            disabled={r.busy || !r.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: `${r.color}08`, border: `1px solid ${r.color}22`,
              borderRadius: 12, padding: '12px 14px',
              cursor: r.onClick && !r.busy ? 'pointer' : 'default',
              textAlign: 'left', width: '100%',
              outline: 'none', fontFamily: FONT_BODY,
              transition: 'background 0.15s, transform 0.12s',
              opacity: r.busy ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (r.onClick && !r.busy) { e.currentTarget.style.background = `${r.color}14`; e.currentTarget.style.transform = 'translateX(2px)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = `${r.color}08`; e.currentTarget.style.transform = 'none' }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${r.color}44` }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 9, background: r.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
              {r.busy ? '…' : <FE emoji={r.emoji} size={15} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{r.title}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{r.sub}</div>
            </div>
            {r.right ?? <div style={{ fontSize: 16, color: MUTED, flexShrink: 0 }}>›</div>}
          </button>
        ))}
      </div>

      {notifOn && notifPerm === 'granted' && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, background: `${GOLD_C}10`, border: `1px solid ${GOLD_C}30`, borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}><FE emoji="🔔" size={12} /> Reminder time</span>
          <input
            ref={timeRef}
            type="time"
            value={notifTime}
            onChange={e => handleTimeChange(e.target.value)}
            style={{ border: `1px solid ${GOLD_C}44`, borderRadius: 8, padding: '4px 10px', fontSize: 13, fontFamily: FONT_BODY, color: NAVY2, background: WHITE, outline: 'none', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 11, color: MUTED }}>daily</span>
        </div>
      )}

      {exportErr && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#B91C1C', fontFamily: FONT_BODY, textAlign: 'center' }}>{exportErr}</div>
      )}

      <button
        onClick={onSignOut}
        style={{ marginTop: 20, width: '100%', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 11, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, textAlign: 'center', transition: 'background 0.15s', outline: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2' }}
        onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px #FCA5A5' }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
      >
        Sign out
      </button>
    </div>
  )
}
