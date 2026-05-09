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
    supabase.from('photos').select('id, voyage_id, day_number, caption, created_at, storage_path').in('voyage_id', ids),
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

async function fetchImageAsDataUrl(url: string): Promise<string> {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader     = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror   = () => resolve('')
      reader.readAsDataURL(blob)
    })
  } catch { return '' }
}

async function exportPDF(userId: string, displayName: string) {
  const data = await fetchAllData(userId)

  // ── Fetch signed URLs for day photos ──────────────────────────────────────
  type PhotoEntry = { url: string; caption: string }
  type PhotoMap   = Record<string, Record<number, PhotoEntry[]>>
  const photoMap: PhotoMap = {}
  await Promise.all(
    ((data.photos ?? []) as Record<string, unknown>[]).map(async p => {
      const path = p.storage_path as string
      if (!path) return
      const { data: sd } = await supabase.storage.from('daily-photos').createSignedUrl(path, 3600)
      if (!sd?.signedUrl) return
      const vid = p.voyage_id as string
      const dn  = (p.day_number as number) || 0
      if (!photoMap[vid])     photoMap[vid]     = {}
      if (!photoMap[vid][dn]) photoMap[vid][dn] = []
      photoMap[vid][dn].push({ url: sd.signedUrl, caption: (p.caption as string) || '' })
    })
  )

  // ── Embed first voyage cover photo as base64 ───────────────────────────────
  const firstV    = data.voyages[0] as Record<string, unknown> | undefined
  const coverImg  = firstV?.cover_photo_url ? await fetchImageAsDataUrl(firstV.cover_photo_url as string) : ''

  // ── Aggregates ────────────────────────────────────────────────────────────
  const totalNights = data.voyages.reduce((s, v) => s + (parseInt(String((v as Record<string, unknown>).total_nights)) || 0), 0)

  const HLABELS: Record<string, string> = {
    port:       'Favourite Port',
    meal:       'Most Memorable Meal',
    funny:      'Funniest Moment',
    view:       'Best View',
    friends:    'Best Moment with Friends & Family',
    first_time: 'Something I Did for the First Time',
    moment:     'The Moment I\'ll Never Forget',
  }

  // ── Per-voyage content ────────────────────────────────────────────────────
  let body = ''

  for (let vi = 0; vi < data.voyages.length; vi++) {
    const v    = data.voyages[vi] as Record<string, unknown>
    const vId  = v.id as string

    const itin      = ((data.itinerary          ?? []) as Record<string, unknown>[]).filter(i => i.voyage_id === vId).sort((a, b) => ((a.day_number as number) || 0) - ((b.day_number as number) || 0))
    const logs      = ((data.daily_logs         ?? []) as Record<string, unknown>[]).filter(l => l.voyage_id === vId).sort((a, b) => ((a.day_number as number) || 0) - ((b.day_number as number) || 0))
    const dining    = ((data.dining_log         ?? []) as Record<string, unknown>[]).filter(d => d.voyage_id === vId)
    const entertain = ((data.entertainment_log  ?? []) as Record<string, unknown>[]).filter(e => e.voyage_id === vId)
    const fav       = ((data.food_fav           ?? []) as Record<string, unknown>[]).find(f => f.voyage_id === vId)
    const budget    = ((data.budget             ?? []) as Record<string, unknown>[]).find(b => b.voyage_id === vId)
    const bItems    = budget ? ((data.budget_items   ?? []) as Record<string, unknown>[]).filter(bi => bi.budget_id === budget.id) : []
    const shopping  = ((data.shopping_items     ?? []) as Record<string, unknown>[]).filter(s => s.voyage_id === vId)
    const highlight = ((data.highlights         ?? []) as Record<string, unknown>[]).find(h => h.voyage_id === vId)
    const vnotes    = ((data.notes              ?? []) as Record<string, unknown>[]).filter(n => n.voyage_id === vId)
    const spent     = bItems.reduce((s, i) => s + (parseFloat(String(i.amount)) || 0), 0)

    const companions  = [v.companion_1, v.companion_2, v.companion_3, v.companion_4].filter(Boolean).map(c => esc(c as string)).join(', ')
    const dateRange   = v.departure_date ? `${fmtDate(v.departure_date as string)}${v.return_date ? ' \u2013 ' + fmtDate(v.return_date as string) : ''}` : ''
    const loggedDays  = logs.filter(l => l.highlights || l.best_moment || l.breakfast || l.lunch || l.dinner || l.exc_notes)
    const vCoverSrc   = (vi === 0 && coverImg) ? coverImg : ((v.cover_photo_url as string) || '')
    const bgStyle     = vCoverSrc ? `style="background-image:url('${vCoverSrc}')"` : ''

    // Chapter header
    body += `
      <div class="chapter ${vi > 0 ? 'page-break' : ''}">
        <div class="chapter-hdr" ${bgStyle}>
          <div class="chapter-overlay"></div>
          <div class="chapter-content">
            <div class="chapter-label">Voyage ${vi + 1}${data.voyages.length > 1 ? ' of ' + data.voyages.length : ''}</div>
            <div class="chapter-ship">${esc((v.ship_name as string) || 'Unnamed Voyage')}</div>
            ${v.cruise_line ? `<div class="chapter-line">${esc(v.cruise_line as string)}</div>` : ''}
            <div class="chapter-pills">
              ${dateRange                ? `<span class="pill">${dateRange}</span>` : ''}
              ${v.total_nights           ? `<span class="pill">${v.total_nights} nights</span>` : ''}
              ${v.departure_port         ? `<span class="pill">from ${esc(v.departure_port as string)}</span>` : ''}
            </div>
            ${companions ? `<div class="chapter-companions">Sailed with ${companions}</div>` : ''}
          </div>
        </div>
        <div class="stats-row">
          ${itin.filter(i => i.port && String(i.port).toLowerCase() !== 'at sea').length > 0 ? `<div class="stat"><div class="stat-val">${itin.filter(i => i.port && String(i.port).toLowerCase() !== 'at sea').length}</div><div class="stat-lbl">Ports Visited</div></div>` : ''}
          ${loggedDays.length > 0  ? `<div class="stat"><div class="stat-val">${loggedDays.length}</div><div class="stat-lbl">Days Logged</div></div>` : ''}
          ${dining.length > 0      ? `<div class="stat"><div class="stat-val">${dining.length}</div><div class="stat-lbl">Restaurants</div></div>` : ''}
          ${spent > 0              ? `<div class="stat"><div class="stat-val">\u00a3${Math.round(spent)}</div><div class="stat-lbl">Total Spent</div></div>` : ''}
        </div>
      </div>`

    // Itinerary timeline
    if (itin.length > 0) {
      body += `<h2 class="sec-title">The Journey</h2><div class="timeline">`
      itin.forEach(i => {
        body += `<div class="tl-item"><div class="tl-dot"></div><div class="tl-port">${esc((i.port as string) || 'At Sea')}</div><div class="tl-detail">Day ${i.day_number ?? ''}${i.date ? ' \u00b7 ' + fmtDate(i.date as string) : ''}${i.arrive ? ' \u00b7 Arrive ' + esc(i.arrive as string) : ''}${i.depart ? ' \u00b7 Depart ' + esc(i.depart as string) : ''}</div></div>`
      })
      body += `</div>`
    }

    // Daily journal
    if (loggedDays.length > 0) {
      body += `<h2 class="sec-title">Daily Journal</h2>`
      loggedDays.forEach(l => {
        const dn       = (l.day_number as number) || 0
        const dayPics  = photoMap[vId]?.[dn] ?? []
        const itinDay  = itin.find(i => i.day_number === dn)
        const port     = (l.port as string) || (itinDay?.port as string) || ''
        const weather  = Array.isArray(l.weather) ? (l.weather as string[]).join(' \u00b7 ') : ''
        const hasMeals = l.breakfast || l.lunch || l.dinner || l.drink

        body += `<div class="day-card"><div class="day-hdr"><div class="day-num">${dn || '?'}</div><div class="day-info"><div class="day-port">${esc(port || 'At Sea')}</div><div class="day-meta">${l.date ? fmtDate(l.date as string) : ''}${weather ? ' \u00b7 ' + esc(weather) : ''}</div></div>${l.rating ? `<div class="day-stars">${stars(l.rating as number)}</div>` : ''}</div><div class="day-body">`

        if (dayPics.length > 0) {
          body += `<div class="photo-row">${dayPics.slice(0, 3).map(p => `<div class="photo-slot"><img src="${esc(p.url)}" alt="${esc(p.caption)}">${p.caption ? `<div class="photo-cap">${esc(p.caption)}</div>` : ''}</div>`).join('')}</div>`
        }

        if (l.highlights)  body += `<p class="day-text">${esc(l.highlights as string)}</p>`
        if (l.best_moment) body += `<div class="pull-quote"><div class="pq-label">\u2736 Best Moment</div><div class="pq-text">\u201c${esc(l.best_moment as string)}\u201d</div></div>`

        if (hasMeals) {
          body += `<div class="meals">`
          if (l.breakfast) body += `<div class="meal"><div class="meal-lbl">Breakfast</div><div class="meal-val">${esc(l.breakfast as string)}</div></div>`
          if (l.lunch)     body += `<div class="meal"><div class="meal-lbl">Lunch</div><div class="meal-val">${esc(l.lunch as string)}</div></div>`
          if (l.dinner)    body += `<div class="meal"><div class="meal-lbl">Dinner</div><div class="meal-val">${esc(l.dinner as string)}</div></div>`
          if (l.drink)     body += `<div class="meal"><div class="meal-lbl">Drinks</div><div class="meal-val">${esc(l.drink as string)}</div></div>`
          body += `</div>`
        }

        if (l.exc_notes) body += `<div class="excursion"><div class="exc-label">Shore Excursion${l.exc_cost ? ' \u00b7 \u00a3' + parseFloat(String(l.exc_cost)).toFixed(2) : ''}${l.duration ? ' \u00b7 ' + esc(l.duration as string) : ''}</div><div class="exc-text">${esc(l.exc_notes as string)}</div></div>`

        body += `</div></div>`
      })
    }

    // Restaurants
    if (dining.length > 0) {
      body += `<h2 class="sec-title">Restaurant & Dining</h2><div class="two-col">`
      dining.forEach(d => {
        body += `<div class="dining-card"><div class="d-venue">${esc((d.venue as string) || 'Restaurant')}</div><div class="d-meta">${d.date ? fmtDate(d.date as string) : ''}${d.meal ? ' \u00b7 ' + esc(d.meal as string) : ''}</div>${d.ordered ? `<div class="d-ordered">${esc(d.ordered as string)}</div>` : ''}${d.notes ? `<div class="d-notes">${esc(d.notes as string)}</div>` : ''}${d.rating ? `<div class="d-stars">${stars(d.rating as number)}</div>` : ''}</div>`
      })
      body += `</div>`
    }

    // Food favourites
    const favKeys   = ['best', 'buffet', 'specialty', 'surprising', 'recreate', 'regret']
    const favLabels: Record<string, string> = { best: 'Best Thing I Ate', buffet: 'Buffet Highlight', specialty: 'Best Specialty Restaurant', surprising: 'Most Surprising Dish', recreate: 'Want to Recreate at Home', regret: 'One Food Regret' }
    if (fav && favKeys.some(k => fav[k])) {
      body += `<h2 class="sec-title">Food Favourites</h2><div class="fav-grid">`
      favKeys.forEach(k => { if (fav[k]) body += `<div class="fav-card"><div class="fav-lbl">${favLabels[k]}</div><div class="fav-val">${esc(fav[k] as string)}</div></div>` })
      body += `</div>`
    }

    // Entertainment
    if (entertain.length > 0) {
      body += `<h2 class="sec-title">Entertainment & Shows</h2><div class="two-col">`
      entertain.forEach(e => {
        body += `<div class="ent-card"><div class="e-name">${esc((e.name as string) || 'Show')}</div><div class="e-meta">${e.type ? esc(e.type as string) : ''}${e.venue ? ' \u00b7 ' + esc(e.venue as string) : ''}${e.duration ? ' \u00b7 ' + esc(e.duration as string) : ''}</div>${e.notes ? `<div class="e-notes">${esc(e.notes as string)}</div>` : ''}${e.rating ? `<div class="e-stars">${stars(e.rating as number)}</div>` : ''}</div>`
      })
      body += `</div>`
    }

    // Shopping & budget
    if (shopping.length > 0) {
      const shopTotal = shopping.reduce((s, i) => s + (parseFloat(String(i.cost || 0)) || 0), 0)
      body += `<h2 class="sec-title">Shopping & Souvenirs</h2><table class="shop-table"><thead><tr><th>Item</th><th>Port / Location</th><th class="r">Cost</th></tr></thead><tbody>${shopping.map(s => `<tr><td>${esc(s.item as string)}</td><td>${esc(s.port as string)}</td><td class="r">\u00a3${parseFloat(String(s.cost || 0)).toFixed(2)}</td></tr>`).join('')}</tbody></table><div class="total-bar"><span>Shopping Total</span><span class="total-val">\u00a3${shopTotal.toFixed(2)}</span></div>`
    }
    if (budget) {
      const budgetAmt = parseFloat(String(budget.total_budget || 0))
      if (!shopping.length) body += `<h2 class="sec-title">Budget</h2>`
      body += `<div class="budget-row"><div class="bud-item"><div class="bud-lbl">Budget</div><div class="bud-val">\u00a3${budgetAmt.toFixed(2)}</div></div><div class="bud-item"><div class="bud-lbl">Spent</div><div class="bud-val" style="color:${spent > budgetAmt ? '#EF4444' : '#C9A227'}">\u00a3${spent.toFixed(2)}</div></div>${budgetAmt > 0 ? `<div class="bud-item"><div class="bud-lbl">Remaining</div><div class="bud-val" style="color:#10B981">\u00a3${Math.max(0, budgetAmt - spent).toFixed(2)}</div></div>` : ''}</div>`
    }

    // Cruise highlights
    if (highlight) {
      const hlEntries = Object.entries(HLABELS).filter(([k]) => (highlight as Record<string, unknown>)[k])
      if (hlEntries.length > 0) {
        body += `<h2 class="sec-title">Cruise Highlights</h2>`
        hlEntries.forEach(([k, label], idx) => {
          body += `<div class="hl-item"><div class="hl-num">${idx + 1}</div><div class="hl-body"><div class="hl-lbl">${esc(label)}</div><div class="hl-text">${esc((highlight as Record<string, unknown>)[k] as string)}</div></div></div>`
        })
      }
    }

    // Notes
    const hasNotes = vnotes.filter(n => n.content || n.title)
    if (hasNotes.length > 0) {
      const rots = ['-1.2deg', '0.8deg', '-0.5deg', '1.1deg', '-0.7deg', '0.4deg']
      body += `<h2 class="sec-title">Notes</h2><div class="notes-grid">`
      hasNotes.forEach((n, ni) => {
        body += `<div class="note-card" style="transform:rotate(${rots[ni % rots.length]})">${n.title ? `<div class="note-title">${esc(n.title as string)}</div>` : ''}${n.content ? `<div class="note-body">${esc(n.content as string).replace(/\n/g, '<br>')}</div>` : ''}</div>`
      })
      body += `</div>`
    }
  }

  // ── Final HTML assembly ───────────────────────────────────────────────────
  const coverShip  = esc((firstV?.ship_name  as string) || 'My Cruise Journal')
  const coverLine  = firstV?.cruise_line  ? esc(firstV.cruise_line  as string) : ''
  const coverDates = firstV?.departure_date ? fmtDate(firstV.departure_date as string) + (firstV.return_date ? ' \u2013 ' + fmtDate(firstV.return_date as string) : '') : ''
  const coverPort  = firstV?.departure_port ? esc(firstV.departure_port as string) : ''
  const exportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(displayName)}'s Cruise Journal</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1C2B3A;background:#F4F1EB}
.cover{position:relative;min-height:100vh;background:#14293F;display:flex;flex-direction:column;justify-content:flex-end;page-break-after:always;overflow:hidden}
.cover-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.45}
.cover-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(20,41,63,.97) 0%,rgba(20,41,63,.55) 55%,rgba(20,41,63,.15) 100%)}
.cover-body{position:relative;z-index:2;padding:52px 60px}
.cover-tag{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#C9A227;margin-bottom:18px}
.cover-ship{font-family:Georgia,'Times New Roman',serif;font-size:56px;font-weight:400;color:#fff;line-height:1.05;margin-bottom:10px}
.cover-cl{font-size:19px;color:rgba(255,255,255,.65);margin-bottom:28px}
.cover-meta{display:flex;gap:28px;flex-wrap:wrap;margin-bottom:36px}
.cover-mi{border-left:2px solid #C9A227;padding-left:14px}
.cover-ml{font-size:9px;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.45);margin-bottom:5px}
.cover-mv{font-size:15px;color:#fff}
.cover-author{padding-top:28px;border-top:1px solid rgba(255,255,255,.15);font-size:14px;color:rgba(255,255,255,.5);font-style:italic}
.wrap{max-width:800px;margin:0 auto;padding:0 48px 64px}
.chapter{}
.page-break{page-break-before:always}
.chapter-hdr{position:relative;min-height:240px;background:#1B3A5C;background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:flex-end;margin:0 -48px;overflow:hidden}
.chapter-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(20,41,63,.96) 0%,rgba(20,41,63,.5) 100%)}
.chapter-content{position:relative;z-index:2;padding:36px 48px}
.chapter-label{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#C9A227;margin-bottom:12px}
.chapter-ship{font-family:Georgia,'Times New Roman',serif;font-size:38px;color:#fff;margin-bottom:6px;line-height:1.1}
.chapter-line{font-size:16px;color:rgba(255,255,255,.6);margin-bottom:14px}
.chapter-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.pill{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:4px 12px;font-size:11px;color:rgba(255,255,255,.8)}
.chapter-companions{font-size:12px;color:rgba(255,255,255,.45);font-style:italic}
.stats-row{display:flex;background:#fff;margin:0 -48px 40px;border-top:3px solid #C9A227}
.stat{flex:1;padding:18px 20px;text-align:center;border-right:1px solid #E0DBD0}
.stat:last-child{border-right:none}
.stat-val{font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#C9A227;margin-bottom:4px}
.stat-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#7A8594}
.sec-title{font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#1B3A5C;margin:44px 0 20px;padding-bottom:12px;border-bottom:2px solid #C9A227;page-break-after:avoid}
.timeline{position:relative;padding-left:36px;margin-bottom:8px}
.timeline::before{content:'';position:absolute;left:10px;top:6px;bottom:6px;width:2px;background:linear-gradient(to bottom,#C9A227,#1B3A5C)}
.tl-item{position:relative;margin-bottom:18px;page-break-inside:avoid}
.tl-dot{position:absolute;left:-30px;top:4px;width:10px;height:10px;border-radius:50%;background:#C9A227;box-shadow:0 0 0 3px #F4F1EB,0 0 0 5px #C9A227}
.tl-port{font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#1B3A5C;margin-bottom:3px}
.tl-detail{font-size:11px;color:#7A8594}
.day-card{background:#fff;border-radius:14px;margin-bottom:24px;overflow:hidden;page-break-inside:avoid;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.day-hdr{background:#1B3A5C;color:#fff;padding:16px 22px;display:flex;align-items:center;gap:16px}
.day-num{font-family:Georgia,'Times New Roman',serif;font-size:38px;color:#C9A227;line-height:1;flex-shrink:0;min-width:48px}
.day-info{flex:1}
.day-port{font-family:Georgia,'Times New Roman',serif;font-size:20px;margin-bottom:2px}
.day-meta{font-size:11px;color:rgba(255,255,255,.6)}
.day-stars{font-size:17px;color:#C9A227;letter-spacing:2px;flex-shrink:0}
.day-body{padding:22px}
.photo-row{display:flex;gap:8px;margin-bottom:18px}
.photo-slot{flex:1;overflow:hidden;border-radius:8px}
.photo-slot img{width:100%;height:160px;object-fit:cover;display:block}
.photo-cap{font-size:10px;color:#7A8594;padding:4px 6px;background:#F9F7F3;font-style:italic}
.day-text{font-size:13px;line-height:1.85;color:#374151;margin-bottom:16px}
.pull-quote{border-left:3px solid #C9A227;padding:12px 18px;margin:16px 0;background:#FFFBEB;border-radius:0 10px 10px 0}
.pq-label{font-size:9px;text-transform:uppercase;letter-spacing:.14em;color:#C9A227;margin-bottom:7px}
.pq-text{font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:#1C2B3A;line-height:1.6}
.meals{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}
.meal{flex:1;min-width:110px;background:#F9F7F3;border-radius:9px;padding:10px 13px}
.meal-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#7A8594;margin-bottom:4px}
.meal-val{font-size:12px;color:#1C2B3A;font-weight:600;line-height:1.4}
.excursion{background:#F0FDF4;border:1px solid #A7F3D0;border-radius:9px;padding:12px 16px;margin-top:12px}
.exc-label{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#0D6B55;margin-bottom:6px}
.exc-text{font-size:12px;color:#374151;line-height:1.65}
.two-col{columns:2;column-gap:16px;margin-bottom:8px}
.dining-card{background:#fff;border-radius:10px;padding:14px 18px;margin-bottom:12px;border-left:3px solid #C9A227;break-inside:avoid}
.d-venue{font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#1B3A5C;margin-bottom:4px}
.d-meta{font-size:11px;color:#7A8594;margin-bottom:5px}
.d-ordered{font-size:12px;color:#374151;font-style:italic;margin-bottom:5px;line-height:1.5}
.d-notes{font-size:11px;color:#7A8594;line-height:1.5;margin-bottom:5px}
.d-stars{font-size:14px;color:#C9A227}
.fav-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px}
.fav-card{background:#fff;border-radius:10px;padding:16px 18px;page-break-inside:avoid}
.fav-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#C9A227;margin-bottom:7px}
.fav-val{font-size:13px;color:#1C2B3A;line-height:1.55}
.ent-card{background:#fff;border-radius:10px;padding:14px 18px;margin-bottom:12px;border-top:3px solid #1B3A5C;break-inside:avoid}
.e-name{font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#1B3A5C;margin-bottom:4px}
.e-meta{font-size:11px;color:#7A8594;margin-bottom:5px}
.e-notes{font-size:12px;color:#374151;font-style:italic;margin-bottom:5px;line-height:1.5}
.e-stars{font-size:14px;color:#C9A227}
.shop-table{width:100%;border-collapse:collapse;font-size:12px;background:#fff;border-radius:12px 12px 0 0;overflow:hidden}
.shop-table th{background:#1B3A5C;color:#fff;padding:11px 16px;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600}
.shop-table td{padding:10px 16px;border-bottom:1px solid #E0DBD0;vertical-align:top}
.shop-table tr:last-child td{border-bottom:none}
.shop-table tr:nth-child(even) td{background:#F9F7F3}
.r{text-align:right!important}
.total-bar{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#1B3A5C;border-radius:0 0 12px 12px;margin-bottom:16px}
.total-bar span{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.6)}
.total-val{font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#C9A227!important}
.budget-row{display:flex;background:#fff;border-radius:12px;overflow:hidden;margin-bottom:16px}
.bud-item{flex:1;padding:18px 22px;border-right:1px solid #E0DBD0;text-align:center}
.bud-item:last-child{border-right:none}
.bud-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#7A8594;margin-bottom:6px}
.bud-val{font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#1B3A5C}
.hl-item{display:flex;background:#fff;border-radius:12px;margin-bottom:14px;overflow:hidden;page-break-inside:avoid}
.hl-num{font-family:Georgia,'Times New Roman',serif;font-size:52px;color:#C9A22728;padding:16px 20px;line-height:1;flex-shrink:0}
.hl-body{padding:16px 20px 16px 0;flex:1}
.hl-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.14em;color:#C9A227;margin-bottom:7px}
.hl-text{font-size:14px;color:#1C2B3A;line-height:1.7}
.notes-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:8px}
.note-card{background:#FFFDE7;border-radius:4px;padding:20px;box-shadow:2px 3px 10px rgba(0,0,0,.1);page-break-inside:avoid}
.note-title{font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#1C2B3A;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #FDE68A}
.note-body{font-size:12px;color:#374151;line-height:1.85}
.back-cover{page-break-before:always;background:#14293F;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px}
.bc-orn{font-family:Georgia,serif;font-size:48px;color:#C9A227;margin-bottom:24px}
.bc-ship{font-family:Georgia,'Times New Roman',serif;font-size:32px;color:#fff;margin-bottom:10px}
.bc-sub{font-size:13px;color:rgba(255,255,255,.45);font-style:italic;margin-bottom:48px}
.bc-foot{font-size:10px;color:rgba(255,255,255,.25);letter-spacing:.22em;text-transform:uppercase}
@media print{@page{margin:0;size:A4}body{background:#fff}.cover,.back-cover{height:100vh}.chapter-hdr,.stats-row{margin:0 -48px}}
</style>
</head>
<body>

<div class="cover">
  ${coverImg ? `<img class="cover-bg" src="${coverImg}" alt="Cover">` : ''}
  <div class="cover-grad"></div>
  <div class="cover-body">
    <div class="cover-tag">A Voyage Journal</div>
    <div class="cover-ship">${coverShip}</div>
    ${coverLine ? `<div class="cover-cl">${coverLine}</div>` : ''}
    <div class="cover-meta">
      ${coverDates ? `<div class="cover-mi"><div class="cover-ml">Dates</div><div class="cover-mv">${coverDates}</div></div>` : ''}
      ${coverPort  ? `<div class="cover-mi"><div class="cover-ml">Departed From</div><div class="cover-mv">${coverPort}</div></div>` : ''}
      ${totalNights ? `<div class="cover-mi"><div class="cover-ml">Nights at Sea</div><div class="cover-mv">${totalNights}</div></div>` : ''}
      ${data.voyages.length > 1 ? `<div class="cover-mi"><div class="cover-ml">Voyages</div><div class="cover-mv">${data.voyages.length}</div></div>` : ''}
    </div>
    <div class="cover-author">${esc(displayName)}&rsquo;s Voyage Journal &nbsp;&middot;&nbsp; ${exportDate}</div>
  </div>
</div>

<div class="wrap">${body}</div>

<div class="back-cover">
  <div class="bc-orn">\u2736</div>
  <div class="bc-ship">${coverShip}</div>
  <div class="bc-sub">${esc(displayName)}&rsquo;s Cruise Journal &nbsp;&middot;&nbsp; ${data.voyages.length} voyage${data.voyages.length !== 1 ? 's' : ''} &nbsp;&middot;&nbsp; ${totalNights} nights at sea</div>
  <div class="bc-foot">Cruise Ship Journal &nbsp;&middot;&nbsp; ${new Date().getFullYear()}</div>
</div>

<script>window.onload=()=>setTimeout(()=>window.print(),800)<\/script>
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
