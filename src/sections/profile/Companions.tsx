// ─────────────────────────────────────────────────────────────────────────────
// profile/Companions.tsx — Horizontally scrollable travel companion cards
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserId } from '../../context'
import { WHITE, BORDER, NAVY2, MUTED, LIGHT, FONT_DISPLAY, FONT_BODY } from '../../constants'

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#EC4899', '#14B8A6', '#6366F1']

const colorFor = (name: string): string =>
  COLORS[(name.charCodeAt(0) + name.length) % COLORS.length]

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  return words[0].slice(0, 2).toUpperCase()
}

interface CompanionEntry {
  name:       string
  voyageCount: number
  ships:      string[]
  avatarUrl?: string | null
}

interface Props {
  onNav?: (id: string) => void
}

export default function Companions({ onNav }: Props) {
  const userId = useUserId()
  const [companions, setCompanions] = useState<CompanionEntry[]>([])
  const [loading,    setLoading]    = useState<boolean>(true)

  useEffect(() => {
    if (!userId) return

    const run = async () => {
      const { data } = await supabase
        .from('voyages')
        .select('id, ship_name, companion_1, companion_2, companion_3, companion_4')
        .eq('user_id', userId)

      if (!data) { setLoading(false); return }

      const map: Record<string, CompanionEntry> = {}
      data.forEach((voyage: { companion_1?: string | null; companion_2?: string | null; companion_3?: string | null; companion_4?: string | null; ship_name?: string | null }) => {
        const fields = [voyage.companion_1, voyage.companion_2, voyage.companion_3, voyage.companion_4]
        fields.filter(Boolean).forEach(raw => {
          const name = raw!.trim()
          const key  = name.toLowerCase()
          if (!map[key]) map[key] = { name, voyageCount: 0, ships: [] }
          map[key].voyageCount++
          if (voyage.ship_name) map[key].ships.push(voyage.ship_name)
        })
      })

      const sorted = Object.values(map).sort((a, b) => b.voyageCount - a.voyageCount)

      const names = sorted.map(c => c.name)
      if (names.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .in('display_name', names)

        const avatarMap: Record<string, string> = {}
        ;(profiles ?? []).forEach((p: { display_name: string; avatar_url?: string | null }) => {
          if (p.avatar_url) avatarMap[p.display_name.toLowerCase()] = p.avatar_url
        })

        sorted.forEach(c => {
          c.avatarUrl = avatarMap[c.name.toLowerCase()] ?? null
        })
      }

      setCompanions(sorted)
      setLoading(false)
    }

    run()
  }, [userId])

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', marginBottom: 20 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>SHIPMATES</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Travel Companions</h2>
        </div>
        <button
          onClick={() => onNav?.('voyage')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY, padding: '4px 0' }}
        >
          Edit in Voyage Details →
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: MUTED, padding: '12px 0' }}>Loading…</div>
      )}

      {!loading && companions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: MUTED }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
          <div style={{ fontWeight: 600, color: NAVY2, marginBottom: 6, fontSize: 14 }}>No companions yet</div>
          <div style={{ fontSize: 13 }}>
            Add shipmates in{' '}
            <span
              onClick={() => onNav?.('voyage')}
              style={{ color: 'var(--t-primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              Voyage Details
            </span>
            .
          </div>
        </div>
      )}

      {!loading && companions.length > 0 && (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {companions.map(c => {
            const color = colorFor(c.name)
            const shipList = [...new Set(c.ships)].join(', ')
            return (
              <div
                key={c.name}
                tabIndex={0}
                title={shipList ? `${c.name} · ${shipList}` : c.name}
                style={{
                  minWidth: 130, background: LIGHT, borderRadius: 14,
                  border: `1px solid ${BORDER}`, padding: '16px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  flexShrink: 0, cursor: 'default', outline: 'none',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${color}66` }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: color,
                  boxShadow: `0 3px 10px ${color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_DISPLAY, fontSize: 17, color: '#FFFFFF',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    getInitials(c.name)
                  )}
                </div>

                <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY2, textAlign: 'center', lineHeight: 1.3, fontFamily: FONT_BODY, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color, background: `${color}14`, borderRadius: 20, padding: '3px 10px', fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>
                  {c.voyageCount} {c.voyageCount === 1 ? 'voyage' : 'voyages'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
