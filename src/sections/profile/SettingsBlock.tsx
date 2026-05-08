// ─────────────────────────────────────────────────────────────────────────────
// profile/SettingsBlock.tsx — Settings, export actions, and sign-out
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserId } from '../../context'
import { WHITE, BORDER, NAVY2, MUTED, FONT_DISPLAY, FONT_BODY } from '../../constants'
import FE from '../../components/FE'

const ROSE_C = '#F43F5E'
const NAVY_C = '#14293F'
const PLUM_C = '#8B5CF6'
const GOLD_C = '#F59E0B'

// ── Data fetcher ──────────────────────────────────────────────────────────────

interface AllData {
  voyages:           Record<string, unknown>[]
  daily_logs?:       Record<string, unknown>[]
  itinerary?:        Record<string, unknown>[]
  food_logs?:        Record<string, unknown>[]
  dining_log?:       Record<string, unknown>[]
  entertainment_log?: Record<string, unknown>[]
  food_fav?:         Record<string, unknown>[]
  budget?:           Record<string, unknown>[]
  budget_items?:     Record<string, unknown>[]
  shopping_items?:   Record<string, unknown>[]
  highlights?:       Record<string, unknown>[]
  packing_items?:    Record<string, unknown>[]
  notes?:            Record<string, unknown>[]
  photos?:           Record<string, unknown>[]
  [key: string]:     unknown
}

async function fetchAllData(userId: string): Promise<AllData> {
  const { data: voyages } = await supabase.from('voyages').select('*').eq('user_id', userId).order('departure_date', { ascending: true })
  if (!voyages || voyages.length === 0) return { voyages: [] }

  const ids = voyages.map((v: { id: string }) => v.id)
  const [dailyRes, itinRes, foodRes, diningRes, entertainRes, foodFavRes, budgetRes, shoppingRes, highlightsRes, packingRes, notesRes, photosRes] = await Promise.all([
    supabase.from('daily_logs').select('*').in('voyage_id', ids),
    supabase.from('itinerary').select('*').in('voyage_id', ids),
    supabase.from('food_logs').select('*').in('voyage_id', ids),
    supabase.from('dining_log').select('*').in('voyage_id', ids),
    supabase.from('entertainment_log').select('*').in('voyage_id', ids),
    supabase.from('food_fav').select('*').in('voyage_id', ids),
    supabase.from('budget').select('*').in('voyage_id', ids),
    supabase.from('shopping_items').select('*').in('voyage_id', ids),
    supabase.from('highlights').select('*').in('voyage_id', ids),
    supabase.from('packing_items').select('*').in('voyage_id', ids),
    supabase.from('notes').select('*').in('voyage_id', ids),
    supabase.from('photos').select('id, voyage_id, day_number, caption, created_at').in('voyage_id', ids),
  ])

  const budgetIds = (budgetRes.data ?? []).map((b: { id: string }) => b.id)
  let budgetItems: Record<string, unknown>[] = []
  if (budgetIds.length > 0) {
    const { data } = await supabase.from('budget_items').select('*').in('budget_id', budgetIds)
    budgetItems = data ?? []
  }

  return {
    voyages,
    daily_logs:        dailyRes.data      ?? [],
    itinerary:         itinRes.data       ?? [],
    food_logs:         foodRes.data       ?? [],
    dining_log:        diningRes.data     ?? [],
    entertainment_log: entertainRes.data  ?? [],
    food_fav:          foodFavRes.data    ?? [],
    budget:            budgetRes.data     ?? [],
    budget_items:      budgetItems,
    shopping_items:    shoppingRes.data   ?? [],
    highlights:        highlightsRes.data ?? [],
    packing_items:     packingRes.data    ?? [],
    notes:             notesRes.data      ?? [],
    photos:            photosRes.data     ?? [],
  }
}

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

function fmtDate(s: string): string {
  if (!s) return ''
  return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function stars(n: number): string { return '★'.repeat(Math.max(0, n)) + '☆'.repeat(Math.max(0, 5 - n)) }
function esc(s: unknown): string { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

async function exportPDF(userId: string, displayName: string) {
  const data = await fetchAllData(userId)
  let voyageSections = ''

  for (const v of data.voyages) {
    const vv        = v as Record<string, unknown>
    const vId       = vv.id as string
    const logs      = (data.daily_logs ?? []).filter((l: Record<string, unknown>) => l.voyage_id === vId).sort((a, b) => ((a.day_number as number) || 0) - ((b.day_number as number) || 0))
    const itin      = (data.itinerary  ?? []).filter((i: Record<string, unknown>) => i.voyage_id === vId).sort((a, b) => ((a.day_number as number) || 0) - ((b.day_number as number) || 0))
    const foods     = (data.food_logs  ?? []).filter((f: Record<string, unknown>) => f.voyage_id === vId)
    const dining    = (data.dining_log ?? []).filter((d: Record<string, unknown>) => d.voyage_id === vId)
    const entertain = (data.entertainment_log ?? []).filter((e: Record<string, unknown>) => e.voyage_id === vId)
    const fav       = (data.food_fav      ?? []).find((f: Record<string, unknown>) => f.voyage_id === vId)
    const budget    = (data.budget        ?? []).find((b: Record<string, unknown>) => b.voyage_id === vId) as (Record<string, unknown> | undefined)
    const bItems    = budget ? (data.budget_items ?? []).filter((bi: Record<string, unknown>) => bi.budget_id === budget.id) : []
    const shopping  = (data.shopping_items ?? []).filter((s: Record<string, unknown>) => s.voyage_id === vId)
    const highlight = (data.highlights    ?? []).find((h: Record<string, unknown>) => h.voyage_id === vId)
    const note      = (data.notes         ?? []).find((n: Record<string, unknown>) => n.voyage_id === vId) as (Record<string, unknown> | undefined)
    const spent     = bItems.reduce((s: number, i: Record<string, unknown>) => s + (parseFloat(String(i.amount)) || 0), 0)

    voyageSections += `
      <div class="voyage">
        <div class="voyage-hdr">
          <div class="vhdr-ship">${esc(vv.ship_name || 'Unnamed Voyage')}</div>
          <div class="vhdr-meta">
            ${vv.cruise_line    ? `<span>${esc(vv.cruise_line)}</span>` : ''}
            ${vv.departure_date ? `<span>${fmtDate(vv.departure_date as string)}${vv.return_date ? ' → ' + fmtDate(vv.return_date as string) : ''}</span>` : ''}
            ${vv.total_nights   ? `<span>${vv.total_nights} nights</span>` : ''}
            ${vv.departure_port ? `<span>from ${esc(vv.departure_port)}</span>` : ''}
          </div>
        </div>
        ${itin.length > 0 ? `<div class="sec"><h2>🗺️ Itinerary</h2><table><thead><tr><th>Day</th><th>Date</th><th>Port</th><th>Arrive</th><th>Depart</th></tr></thead><tbody>${itin.map((i: Record<string, unknown>) => `<tr><td>Day ${i.day_number ?? ''}</td><td>${esc(i.date)}</td><td>${esc(i.port)}</td><td>${esc(i.arrive)}</td><td>${esc(i.depart)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${logs.length > 0 ? `<div class="sec"><h2>📅 Daily Log</h2>${logs.map((l: Record<string, unknown>) => `<div class="day-card"><div class="day-title">Day ${l.day_number ?? ''}${l.date ? ' · ' + esc(l.date) : ''}${l.port ? ' · ' + esc(l.port) : ''}${l.rating ? ' · ' + stars(l.rating as number) : ''}</div>${l.highlights ? `<div class="field"><b>Highlights:</b> ${esc(l.highlights)}</div>` : ''}${l.best_moment ? `<div class="field"><b>Best Moment:</b> ${esc(l.best_moment)}</div>` : ''}${l.exc_notes ? `<div class="field"><b>Excursion:</b> ${esc(l.exc_notes)}</div>` : ''}</div>`).join('')}</div>` : ''}
        ${foods.length > 0 ? `<div class="sec"><h2>🍴 Food Log</h2><table><thead><tr><th>Meal</th><th>Port</th><th>Venue</th><th>What I Had</th><th>Rating</th></tr></thead><tbody>${foods.map((f: Record<string, unknown>) => `<tr><td>${esc(f.meal_type)}</td><td>${esc(f.port)}</td><td>${esc(f.venue)}</td><td>${esc(f.what_i_had)}</td><td>${f.rating ? stars(f.rating as number) : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${dining.length > 0 ? `<div class="sec"><h2>🍽️ Restaurant Log</h2><table><thead><tr><th>Venue</th><th>Date</th><th>Meal</th><th>Ordered</th><th>Rating</th></tr></thead><tbody>${dining.map((d: Record<string, unknown>) => `<tr><td>${esc(d.venue)}</td><td>${esc(d.date)}</td><td>${esc(d.meal)}</td><td>${esc(d.ordered)}</td><td>${d.rating ? stars(d.rating as number) : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${entertain.length > 0 ? `<div class="sec"><h2>🎭 Entertainment Log</h2><table><thead><tr><th>Show / Event</th><th>Type</th><th>Venue</th><th>Duration</th><th>Rating</th></tr></thead><tbody>${entertain.map((e: Record<string, unknown>) => `<tr><td>${esc(e.name)}</td><td>${esc(e.type)}</td><td>${esc(e.venue)}</td><td>${esc(e.duration)}</td><td>${e.rating ? stars(e.rating as number) : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${fav ? `<div class="sec"><h2>💛 Food Favourites</h2>${(fav as Record<string, unknown>).best ? `<div class="field"><b>Best thing I ate:</b> ${esc((fav as Record<string, unknown>).best)}</div>` : ''}${(fav as Record<string, unknown>).buffet ? `<div class="field"><b>Buffet pick:</b> ${esc((fav as Record<string, unknown>).buffet)}</div>` : ''}</div>` : ''}
        ${budget ? `<div class="sec"><h2>💳 Budget Tracker</h2><div class="summary-row"><span>Budget: <b>£${parseFloat(String(budget.total_budget || 0)).toFixed(2)}</b></span><span>Spent: <b>£${spent.toFixed(2)}</b></span></div></div>` : ''}
        ${shopping.length > 0 ? `<div class="sec"><h2>🛍️ Shopping Log</h2><table><thead><tr><th>Item</th><th>Port</th><th>Cost</th></tr></thead><tbody>${shopping.map((s: Record<string, unknown>) => `<tr><td>${esc(s.item)}</td><td>${esc(s.port)}</td><td>£${parseFloat(String(s.cost || 0)).toFixed(2)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${highlight ? `<div class="sec"><h2>🌟 Cruise Highlights</h2>${(highlight as Record<string, unknown>).port ? `<div class="field"><b>Best Port:</b> ${esc((highlight as Record<string, unknown>).port)}</div>` : ''}</div>` : ''}
        ${note?.content ? `<div class="sec"><h2>📝 Notes</h2><div class="notes-body">${esc(note.content).replace(/\n/g, '<br>')}</div></div>` : ''}
      </div>
    `
  }

  const totalNights = data.voyages.reduce((s, v) => s + (parseInt(String((v as Record<string, unknown>).total_nights)) || 0), 0)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(displayName)}'s Cruise Journal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Nunito',sans-serif;color:#1C2B3A;background:#fff;padding:40px;max-width:860px;margin:auto}
    h1{font-family:'Fredoka One',cursive;color:#14293F}h2{font-family:'Fredoka One',cursive;font-size:17px;color:#1B3A5C;margin:0 0 10px;padding-bottom:4px;border-bottom:2px solid #C9A227}
    .cover{text-align:center;padding:60px 0 48px;border-bottom:3px solid #C9A227;margin-bottom:40px}.cover h1{font-size:42px;margin-bottom:8px}
    .cover .sub{font-size:14px;color:#6B7280;margin-top:6px}.cover .stats{display:flex;justify-content:center;gap:32px;margin-top:24px}
    .cover .stat-val{font-family:'Fredoka One',cursive;font-size:28px;color:#C9A227}.cover .stat-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-top:2px}
    .voyage{page-break-before:always;margin-bottom:48px}.voyage:first-of-type{page-break-before:avoid}
    .voyage-hdr{background:#14293F;color:#fff;padding:20px 24px;border-radius:12px;margin-bottom:24px}.vhdr-ship{font-family:'Fredoka One',cursive;font-size:26px;color:#C9A227;margin-bottom:6px}
    .vhdr-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:rgba(255,255,255,.7)}.sec{margin-bottom:24px}
    .day-card{background:#F9FAFB;border-left:3px solid #1B3A5C;padding:10px 14px;margin-bottom:8px;border-radius:0 8px 8px 0}.day-title{font-weight:700;font-size:13px;margin-bottom:5px;color:#14293F}
    .field{font-size:12px;margin-bottom:3px;line-height:1.55}.summary-row{display:flex;gap:24px;font-size:12px;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}th{background:#1B3A5C;color:#fff;padding:6px 10px;text-align:left;font-size:10px;letter-spacing:.05em}
    td{padding:6px 10px;border-bottom:1px solid #E5E7EB;vertical-align:top}tr:nth-child(even) td{background:#F9FAFB}.notes-body{font-size:12px;line-height:1.8}
    @media print{body{padding:20px}.voyage{page-break-before:always}}
  </style>
</head>
<body>
  <div class="cover">
    <div style="font-size:52px;margin-bottom:14px">🚢</div>
    <h1>${esc(displayName)}'s Cruise Journal</h1>
    <div class="sub">Exported on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <div class="stats">
      <div><div class="stat-val">${data.voyages.length}</div><div class="stat-lbl">Voyages</div></div>
      <div><div class="stat-val">${totalNights}</div><div class="stat-lbl">Nights at Sea</div></div>
      <div><div class="stat-val">${(data.daily_logs ?? []).length}</div><div class="stat-lbl">Days Logged</div></div>
      <div><div class="stat-val">${(data.photos ?? []).length}</div><div class="stat-lbl">Photos</div></div>
    </div>
  </div>
  ${voyageSections}
  <script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Please allow pop-ups for this site to export as PDF.'); return }
  win.document.write(html)
  win.document.close()
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
    try { await exportPDF(userId, displayName || 'My') }
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
