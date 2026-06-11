// pages/AdminPage.tsx — Full admin console at /admin

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, FileText, Flag, Shield, BarChart2,
  Trash2, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Search, ChevronDown,
} from 'lucide-react'
import { WHITE, BORDER, NAVY2, MUTED, GOLD, TEAL, FONT_DISPLAY, FONT_BODY, TEXT } from '@/constants'
import { useIsAdmin, useReports, useModerationAction } from '@/features/safety/hooks'
import type { ReportRow } from '@/features/safety/hooks'
import {
  useAdminStats, useAdminUsers, useAdminPosts, useAdminAuditLog,
  useAdminDeletePost, useAdminUserAction,
} from '@/features/admin/hooks'
import type { AdminUserRow, AdminPostRow, AuditRow } from '@/features/admin/hooks'

// ── Design tokens ─────────────────────────────────────────────────────────────

const ADMIN_DARK  = '#0F172A'
const ADMIN_PANEL = '#1E293B'
const RED         = '#DC2626'
const AMBER       = '#D97706'
const GREEN       = '#16A34A'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function initials(name: string | null, email: string | null): string {
  if (name) return name.slice(0, 2).toUpperCase()
  if (email) return email.slice(0, 2).toUpperCase()
  return '??'
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, sub }: {
  icon: string; label: string; value: number | string; color: string; sub?: string
}) {
  return (
    <div style={{
      background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6,
      borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: NAVY2, fontFamily: 'Georgia,serif', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT_BODY }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>{sub}</div>}
    </div>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ user }: { user: AdminUserRow }) {
  if (user.is_banned)    return <span style={{ fontSize: 10, fontWeight: 700, background: '#FEF2F2', color: RED,   border: `1px solid ${RED}40`,   borderRadius: 6, padding: '2px 7px', fontFamily: FONT_BODY }}>BANNED</span>
  if (user.is_suspended) return <span style={{ fontSize: 10, fontWeight: 700, background: '#FFFBEB', color: AMBER, border: `1px solid ${AMBER}40`, borderRadius: 6, padding: '2px 7px', fontFamily: FONT_BODY }}>SUSPENDED</span>
  if (user.is_admin)     return <span style={{ fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, padding: '2px 7px', fontFamily: FONT_BODY }}>ADMIN</span>
  return <span style={{ fontSize: 10, fontWeight: 700, background: '#F0FDF4', color: GREEN, border: `1px solid ${GREEN}40`, borderRadius: 6, padding: '2px 7px', fontFamily: FONT_BODY }}>ACTIVE</span>
}

// ── UserRow ───────────────────────────────────────────────────────────────────

function UserRow({ user }: { user: AdminUserRow }) {
  const [open,  setOpen]  = useState(false)
  const [notes, setNotes] = useState('')
  const action = useAdminUserAction()

  const do_ = (act: 'suspend' | 'ban' | 'restore' | 'grant_admin' | 'revoke_admin') =>
    action.mutateAsync({ action: act, userId: user.user_id, notes: notes.trim() || undefined })
      .then(() => setOpen(false))

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar */}
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: NAVY2, color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials(user.display_name, user.email)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{user.display_name || 'No name'}</span>
            <StatusBadge user={user} />
          </div>
          <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, marginTop: 1 }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>🚢 {user.voyage_count} voyage{user.voyage_count !== 1 ? 's' : ''}</span>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>📝 {user.post_count} post{user.post_count !== 1 ? 's' : ''}</span>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>Joined {user.created_at ? fmt(user.created_at) : '—'}</span>
          </div>
        </div>

        <button
          onClick={() => setOpen(v => !v)}
          style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MUTED, fontFamily: FONT_BODY, flexShrink: 0 }}
        >
          Actions <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
      </div>

      {open && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${BORDER}`, background: '#F9FAFB' }}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes / reason (optional)"
            rows={2}
            style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: FONT_BODY, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {!user.is_suspended && !user.is_banned && (
              <button onClick={() => do_('suspend')} disabled={action.isPending} style={btnStyle(AMBER)}>Suspend 7 days</button>
            )}
            {!user.is_banned && (
              <button onClick={() => do_('ban')} disabled={action.isPending} style={btnStyle(RED)}>Ban account</button>
            )}
            {(user.is_suspended || user.is_banned) && (
              <button onClick={() => do_('restore')} disabled={action.isPending} style={btnStyle(GREEN)}>Restore account</button>
            )}
            {!user.is_admin && (
              <button onClick={() => do_('grant_admin')} disabled={action.isPending} style={btnStyle('#2563EB')}>Grant admin</button>
            )}
            {user.is_admin && (
              <button onClick={() => do_('revoke_admin')} disabled={action.isPending} style={btnStyle(MUTED)}>Revoke admin</button>
            )}
          </div>
          {user.ban_reason && (
            <div style={{ marginTop: 8, fontSize: 11, color: RED, fontFamily: FONT_BODY }}>Ban reason: {user.ban_reason}</div>
          )}
          {user.suspension_until && (
            <div style={{ marginTop: 4, fontSize: 11, color: AMBER, fontFamily: FONT_BODY }}>Suspended until: {fmtTime(user.suspension_until)}</div>
          )}
        </div>
      )}
    </div>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return { background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600 }
}

// ── PostRow ───────────────────────────────────────────────────────────────────

const AUDIENCE_COLOR: Record<string, { bg: string; color: string }> = {
  public:  { bg: '#F0FDF4', color: GREEN },
  family:  { bg: '#EFF6FF', color: '#2563EB' },
  private: { bg: '#F3F4F6', color: MUTED },
}

function PostRow({ post }: { post: AdminPostRow }) {
  const [confirm, setConfirm] = useState(false)
  const del = useAdminDeletePost()
  const aud = AUDIENCE_COLOR[post.audience] ?? AUDIENCE_COLOR.private

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_BODY, background: aud.bg, color: aud.color, border: `1px solid ${aud.color}40`, borderRadius: 6, padding: '2px 7px' }}>{post.audience}</span>
          {(post.media_paths ?? []).length > 0 && <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>📷 {post.media_paths.length}</span>}
          <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>{post.created_at ? fmtTime(post.created_at) : '—'}</span>
        </div>
        {post.title && <div style={{ fontSize: 13, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY, marginBottom: 2 }}>{post.title}</div>}
        <div style={{ fontSize: 12, color: TEXT, fontFamily: FONT_BODY, lineHeight: 1.5 }}>{post.body.slice(0, 120)}{post.body.length > 120 ? '…' : ''}</div>
        <div style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY, marginTop: 4 }}>
          By {post.author_name ?? post.author_email ?? 'Unknown'} · ID <code style={{ fontSize: 10 }}>{post.id.slice(0, 8)}…</code>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} style={{ background: 'none', border: `1px solid ${RED}40`, color: RED, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trash2 size={12} /> Delete
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => del.mutate(post.id)} disabled={del.isPending} style={{ background: RED, color: WHITE, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, fontWeight: 700 }}>
              {del.isPending ? '…' : 'Yes, delete'}
            </button>
            <button onClick={() => setConfirm(false)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ReportCard (inline from AdminReportsPage) ─────────────────────────────────

const REPORT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open:         { label: 'Open',         color: RED,   bg: '#FEF2F2' },
  under_review: { label: 'Under Review', color: AMBER, bg: '#FFFBEB' },
  resolved:     { label: 'Resolved',     color: GREEN, bg: '#F0FDF4' },
  dismissed:    { label: 'Dismissed',    color: MUTED, bg: '#F3F4F6' },
}
const REASON_LABELS: Record<string, string> = {
  spam: 'Spam', harassment: 'Harassment', offensive_content: 'Offensive content',
  inappropriate_photo: 'Inappropriate photo', fake_account: 'Fake account',
  privacy_concern: 'Privacy concern', other: 'Other',
}

function ReportCard({ report }: { report: ReportRow }) {
  const [open,  setOpen]  = useState(false)
  const [notes, setNotes] = useState('')
  const mod = useModerationAction()
  const st  = REPORT_STATUS[report.status] ?? REPORT_STATUS.open

  const doStatus = (status: string) =>
    mod.mutateAsync({ action: 'update_status', reportId: report.id, status, notes: notes.trim() || undefined })
      .then(() => setOpen(false))
  const doUser = (act: 'suspend' | 'ban' | 'restore') =>
    report.reported_user_id &&
    mod.mutateAsync({ action: act, targetUserId: report.reported_user_id, notes: notes.trim() || undefined })

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: open ? `1px solid ${BORDER}` : 'none' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 6, padding: '2px 7px', fontFamily: FONT_BODY }}>{report.report_type}</span>
            <span style={{ fontSize: 12, color: TEXT, fontFamily: FONT_BODY }}>{REASON_LABELS[report.reason] ?? report.reason}</span>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>{fmtTime(report.created_at)}</span>
          </div>
          {report.description && <p style={{ margin: '0 0 6px', fontSize: 12, color: TEXT, fontFamily: FONT_BODY, fontStyle: 'italic' }}>"{report.description}"</p>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {report.reporter_id && <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>Reporter: <code style={{ fontSize: 10 }}>{report.reporter_id.slice(0,8)}…</code></span>}
            {report.reported_user_id && <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>Reported: <code style={{ fontSize: 10 }}>{report.reported_user_id.slice(0,8)}…</code></span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_BODY, color: st.color, background: st.bg, borderRadius: 6, padding: '2px 8px' }}>{st.label}</span>
          <button onClick={() => setOpen(v => !v)} style={{ fontSize: 12, color: 'var(--t-primary)', background: 'none', border: `1px solid var(--t-primary)`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT_BODY, fontWeight: 600 }}>
            {open ? 'Close' : 'Actions'}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ padding: '12px 16px', background: '#F9FAFB' }}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" rows={2}
            style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: FONT_BODY, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Status</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {['under_review','resolved','dismissed'].map(s => (
              <button key={s} onClick={() => doStatus(s)} disabled={mod.isPending || report.status === s}
                style={{ ...btnStyle(REPORT_STATUS[s].color), opacity: mod.isPending || report.status === s ? 0.5 : 1 }}>
                {REPORT_STATUS[s].label}
              </button>
            ))}
          </div>
          {report.reported_user_id && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>User action</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => doUser('suspend')} disabled={mod.isPending} style={btnStyle(AMBER)}>Suspend 7 days</button>
                <button onClick={() => doUser('ban')}     disabled={mod.isPending} style={btnStyle(RED)}>Ban account</button>
                <button onClick={() => doUser('restore')} disabled={mod.isPending} style={btnStyle(GREEN)}>Restore account</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'users' | 'reports' | 'posts' | 'audit'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',  icon: <BarChart2 size={14} /> },
  { id: 'users',    label: 'Users',     icon: <Users size={14} />     },
  { id: 'reports',  label: 'Reports',   icon: <Flag size={14} />      },
  { id: 'posts',    label: 'Posts',     icon: <FileText size={14} />  },
  { id: 'audit',    label: 'Audit Log', icon: <Shield size={14} />    },
]

// ── OverviewTab ───────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading, refetch } = useAdminStats()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT_BODY }}>Platform snapshot</div>
        <button onClick={() => refetch()} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: FONT_BODY }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 110, borderRadius: 14 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          <StatCard icon="👥" label="Total Users"    value={stats?.total_users     ?? 0} color="var(--t-primary)" />
          <StatCard icon="🚢" label="Total Voyages"  value={stats?.total_voyages   ?? 0} color={TEAL} />
          <StatCard icon="📝" label="Total Posts"    value={stats?.total_posts     ?? 0} color={GOLD} />
          <StatCard icon="🚨" label="Open Reports"   value={stats?.open_reports    ?? 0} color={RED}   sub={stats?.open_reports ? 'Needs attention' : 'All clear'} />
          <StatCard icon="🔒" label="Banned Users"   value={stats?.banned_users    ?? 0} color={RED} />
          <StatCard icon="⏸️"  label="Suspended"      value={stats?.suspended_users ?? 0} color={AMBER} />
        </div>
      )}
    </div>
  )
}

// ── UsersTab ──────────────────────────────────────────────────────────────────

const USER_FILTERS = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned',    label: 'Banned' },
  { value: 'admins',    label: 'Admins' },
]

function UsersTab() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const { data: users = [], isLoading } = useAdminUsers(filter, search)

  return (
    <div>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 13, fontFamily: FONT_BODY, outline: 'none', boxSizing: 'border-box', background: WHITE }}
        />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {USER_FILTERS.map(f => {
          const active = filter === f.value
          return (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, fontWeight: active ? 700 : 400, border: `1.5px solid ${active ? 'var(--t-primary)' : BORDER}`, background: active ? 'var(--t-bg)' : WHITE, color: active ? 'var(--t-primary)' : MUTED, transition: 'all 0.12s' }}>
              {f.label}
            </button>
          )
        })}
        <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, alignSelf: 'center', marginLeft: 4 }}>{users.length} result{users.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      )}
      {!isLoading && users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: MUTED, fontFamily: FONT_BODY, fontSize: 14 }}>
          No users match this filter.
        </div>
      )}
      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map(u => <UserRow key={u.id} user={u} />)}
        </div>
      )}
    </div>
  )
}

// ── ReportsTab ────────────────────────────────────────────────────────────────

const REPORT_FILTERS = [
  { value: 'all',          label: 'All' },
  { value: 'open',         label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved',     label: 'Resolved' },
  { value: 'dismissed',    label: 'Dismissed' },
]

function ReportsTab() {
  const [filter, setFilter] = useState('open')
  const { data: reports = [], isLoading } = useReports(filter)
  const openCount = reports.filter(r => r.status === 'open').length

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {REPORT_FILTERS.map(f => {
          const active = filter === f.value
          return (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, fontWeight: active ? 700 : 400, border: `1.5px solid ${active ? 'var(--t-primary)' : BORDER}`, background: active ? 'var(--t-bg)' : WHITE, color: active ? 'var(--t-primary)' : MUTED }}>
              {f.label}
            </button>
          )
        })}
        {openCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, background: '#FEF2F2', color: RED, border: `1px solid ${RED}40`, borderRadius: 12, padding: '3px 10px', fontFamily: FONT_BODY }}>{openCount} open</span>}
      </div>

      {isLoading && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 80, borderRadius: 12 }} />)}</div>}
      {!isLoading && reports.length === 0 && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
          <CheckCircle size={36} color={GREEN} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY2, fontFamily: FONT_DISPLAY, marginBottom: 4 }}>Queue is clear</div>
          <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>No {filter !== 'all' ? filter.replace('_',' ') : ''} reports.</div>
        </div>
      )}
      {!isLoading && reports.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reports.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  )
}

// ── PostsTab ──────────────────────────────────────────────────────────────────

const POST_FILTERS = [
  { value: 'all',     label: 'All' },
  { value: 'public',  label: 'Public' },
  { value: 'family',  label: 'Family' },
  { value: 'private', label: 'Private' },
]

function PostsTab() {
  const [filter, setFilter] = useState('public')
  const { data: posts = [], isLoading } = useAdminPosts(filter)

  return (
    <div>
      <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, marginBottom: 12 }}>
        Showing latest 100 posts. Use filters to narrow by audience.
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {POST_FILTERS.map(f => {
          const active = filter === f.value
          return (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, fontWeight: active ? 700 : 400, border: `1.5px solid ${active ? 'var(--t-primary)' : BORDER}`, background: active ? 'var(--t-bg)' : WHITE, color: active ? 'var(--t-primary)' : MUTED }}>
              {f.label}
            </button>
          )
        })}
        <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, alignSelf: 'center', marginLeft: 4 }}>{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 90, borderRadius: 12 }} />)}</div>}
      {!isLoading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: MUTED, fontFamily: FONT_BODY }}>No posts found.</div>
      )}
      {!isLoading && posts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {posts.map(p => <PostRow key={p.id} post={p} />)}
        </div>
      )}
    </div>
  )
}

// ── AuditTab ──────────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  ban:          { icon: <XCircle size={14} />,     color: RED },
  suspend:      { icon: <AlertTriangle size={14} />, color: AMBER },
  restore:      { icon: <CheckCircle size={14} />,  color: GREEN },
  update_status:{ icon: <Flag size={14} />,         color: 'var(--t-primary)' },
  grant_admin:  { icon: <Shield size={14} />,       color: '#2563EB' },
  revoke_admin: { icon: <Shield size={14} />,       color: MUTED },
}

function AuditTab() {
  const { data: rows = [], isLoading } = useAdminAuditLog()

  return (
    <div>
      <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, marginBottom: 16 }}>Latest 200 moderation actions across all admins.</div>

      {isLoading && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 52, borderRadius: 10 }} />)}</div>}
      {!isLoading && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: MUTED, fontFamily: FONT_BODY }}>No moderation actions recorded yet.</div>
      )}
      {!isLoading && rows.length > 0 && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
          {rows.map((row: AuditRow, i) => {
            const ic = ACTION_ICONS[row.action] ?? { icon: <Shield size={14} />, color: MUTED }
            return (
              <div key={row.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <span style={{ color: ic.color, flexShrink: 0 }}>{ic.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{row.action.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}> on {row.target_type} </span>
                  <code style={{ fontSize: 10, color: MUTED }}>{row.target_id.slice(0, 8)}…</code>
                  {row.notes && <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}> — {row.notes}</span>}
                </div>
                <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY, flexShrink: 0 }}>{fmtTime(row.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── AdminPage ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const { data: isAdmin, isLoading: checking } = useIsAdmin()

  if (checking) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: MUTED, fontFamily: FONT_BODY }}>Checking permissions…</div>
  )

  if (!isAdmin) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <div style={{ fontSize: 22, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Access denied</div>
      <div style={{ fontSize: 14, color: MUTED, fontFamily: FONT_BODY }}>Admin access required.</div>
    </div>
  )

  const openCount = 0 // badge driven by stats; kept simple

  return (
    <div>
      {/* Header */}
      <div style={{ background: ADMIN_DARK, borderRadius: 16, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: GOLD + '22', border: `1px solid ${GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={22} color={GOLD} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY }}>Admin Console</h1>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: FONT_BODY, marginTop: 2 }}>Kiran Parmar · kiran.parmar@outlook.com</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 4 }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 10px', borderRadius: 9, cursor: 'pointer', border: 'none',
                background: active ? ADMIN_DARK : 'transparent',
                color:      active ? WHITE : MUTED,
                fontSize: 12, fontFamily: FONT_BODY, fontWeight: active ? 700 : 500,
                transition: 'all 0.15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'overview' && <OverviewTab />}
          {tab === 'users'    && <UsersTab />}
          {tab === 'reports'  && <ReportsTab />}
          {tab === 'posts'    && <PostsTab />}
          {tab === 'audit'    && <AuditTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
