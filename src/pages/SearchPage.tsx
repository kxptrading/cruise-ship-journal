// pages/SearchPage.tsx — Global search across voyages and posts

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Ship, FileText, MapPin, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'
import { WHITE, BORDER, MUTED, NAVY2, GOLD, TEAL, FONT_DISPLAY, FONT_BODY } from '@/constants'
import FE from '@/components/FE'
import { STAGGER, FADE_UP } from '@/lib/motion'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VoyageResult {
  id:             string
  ship_name:      string | null
  cruise_line:    string | null
  departure_date: string | null
  return_date:    string | null
  cover_photo_url: string | null
}

interface PostResult {
  id:         string
  voyage_id:  string
  title:      string | null
  body:       string | null
  location:   string | null
  post_date:  string | null
  audience:   string
}

// ── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Result cards ──────────────────────────────────────────────────────────────

function VoyageResultCard({ voyage, onClick }: { voyage: VoyageResult; onClick: () => void }) {
  const dateRange = voyage.departure_date
    ? new Date(voyage.departure_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.14 }}
      style={{
        width: '100%', background: WHITE, border: `1px solid ${BORDER}`,
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
        fontFamily: FONT_BODY, transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--t-primary)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--t-primary-dk), var(--t-primary))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {voyage.cover_photo_url
          ? <img src={voyage.cover_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <FE emoji="🚢" size={20} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {voyage.ship_name || 'Unnamed Voyage'}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
          {voyage.cruise_line && (
            <span style={{ fontSize: 12, color: MUTED }}>{voyage.cruise_line}</span>
          )}
          {dateRange && (
            <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={11} /> {dateRange}
            </span>
          )}
        </div>
      </div>
      <Ship size={15} color={MUTED} style={{ flexShrink: 0 }} />
    </motion.button>
  )
}

function PostResultCard({ post, onClick }: { post: PostResult; onClick: () => void }) {
  const dateLabel = post.post_date
    ? new Date(post.post_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const preview = post.title || post.body?.slice(0, 80) || 'Untitled post'

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.14 }}
      style={{
        width: '100%', background: WHITE, border: `1px solid ${BORDER}`,
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
        fontFamily: FONT_BODY, transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: `${GOLD}18`, border: `1px solid ${GOLD}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FE emoji="📝" size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, color: NAVY2, fontFamily: FONT_DISPLAY, fontWeight: 400, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preview}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
          {post.location && (
            <span style={{ fontSize: 12, color: TEAL, display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} /> {post.location}
            </span>
          )}
          {dateLabel && (
            <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={11} /> {dateLabel}
            </span>
          )}
        </div>
      </div>
      <FileText size={15} color={MUTED} style={{ flexShrink: 0 }} />
    </motion.button>
  )
}

// ── SearchPage ─────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const navigate = useNavigate()
  const userId   = useUserId()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const q = useDebounce(query.trim(), 300)

  // Follow ?q= changes (e.g. tapping a #hashtag link while already on Search).
  const urlQ = searchParams.get('q') ?? ''
  useEffect(() => { if (urlQ) setQuery(urlQ) }, [urlQ])

  const enabled = q.length >= 2

  const { data: voyageResults = [], isFetching: voyagesFetching } = useQuery<VoyageResult[]>({
    queryKey: ['search-voyages', userId, q],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voyages')
        .select('id, ship_name, cruise_line, departure_date, return_date, cover_photo_url')
        .eq('user_id', userId!)
        .or(`ship_name.ilike.%${q}%,cruise_line.ilike.%${q}%,departure_port.ilike.%${q}%`)
        .order('departure_date', { ascending: false })
        .limit(5)
      if (error) throw error
      return data ?? []
    },
  })

  const { data: postResults = [], isFetching: postsFetching } = useQuery<PostResult[]>({
    queryKey: ['search-posts', userId, q],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, voyage_id, title, body, location, post_date, audience')
        .eq('user_id', userId!)
        .or(`title.ilike.%${q}%,body.ilike.%${q}%,location.ilike.%${q}%`)
        .order('post_date', { ascending: false })
        .limit(10)
      if (error) throw error
      return data ?? []
    },
  })

  const isFetching  = voyagesFetching || postsFetching
  const hasResults  = voyageResults.length > 0 || postResults.length > 0
  const hasSearched = enabled && !isFetching

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
          Search
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
          Search across your voyages and journal posts.
        </p>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <Search
          size={18}
          color={query ? 'var(--t-primary)' : MUTED}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.15s' }}
        />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search voyages, posts, locations…"
          style={{
            width: '100%', boxSizing: 'border-box',
            height: 48, paddingLeft: 44, paddingRight: 16,
            fontSize: 15, fontFamily: FONT_BODY, color: NAVY2,
            background: WHITE, border: `1.5px solid ${query ? 'var(--t-primary)' : BORDER}`,
            borderRadius: 12, outline: 'none',
            boxShadow: query ? '0 0 0 3px var(--t-primary)18' : 'none',
            transition: 'border-color 0.18s, box-shadow 0.18s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--t-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--t-primary)18' }}
          onBlur={e => { if (!query) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' } }}
        />
        {isFetching && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="skeleton-shimmer" style={{ width: 16, height: 16, borderRadius: '50%' }} />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* Idle prompt */}
        {!enabled && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ textAlign: 'center', padding: '48px 0', color: MUTED, fontFamily: FONT_BODY }}>
              <FE emoji="🔍" size={40} />
              <p style={{ marginTop: 12, fontSize: 14 }}>
                Type at least 2 characters to search.
              </p>
            </div>
          </motion.div>
        )}

        {/* No results */}
        {hasSearched && !hasResults && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ textAlign: 'center', padding: '48px 0', color: MUTED, fontFamily: FONT_BODY }}>
              <FE emoji="🧐" size={40} />
              <p style={{ marginTop: 12, fontSize: 14 }}>
                No results for <strong style={{ color: NAVY2 }}>"{q}"</strong>.
              </p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {hasSearched && hasResults && (
          <motion.div key="results" variants={STAGGER} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {voyageResults.length > 0 && (
              <motion.div variants={FADE_UP}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_BODY, marginBottom: 10 }}>
                  Voyages · {voyageResults.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {voyageResults.map(v => (
                    <VoyageResultCard
                      key={v.id}
                      voyage={v}
                      onClick={() => navigate(`/voyages/${v.id}`)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {postResults.length > 0 && (
              <motion.div variants={FADE_UP}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_BODY, marginBottom: 10 }}>
                  Posts · {postResults.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {postResults.map(p => (
                    <PostResultCard
                      key={p.id}
                      post={p}
                      onClick={() => navigate(`/voyages/${p.voyage_id}/posts/${p.id}`)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
