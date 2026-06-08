// pages/AdminReportsPage.tsx — Admin moderation queue at /admin/reports

import { useState } from 'react'
import { motion } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, GOLD, FONT_DISPLAY, FONT_BODY, TEXT } from '@/constants'
import { useIsAdmin, useReports, useModerationAction } from '@/features/safety/hooks'
import type { ReportRow } from '@/features/safety/hooks'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:         { label: 'Open',         color: '#DC2626', bg: '#FEF2F2' },
  under_review: { label: 'Under Review', color: '#D97706', bg: '#FFFBEB' },
  resolved:     { label: 'Resolved',     color: '#16A34A', bg: '#F0FDF4' },
  dismissed:    { label: 'Dismissed',    color: '#6B7280', bg: '#F3F4F6' },
}

const REASON_LABELS: Record<string, string> = {
  spam:                'Spam',
  harassment:          'Harassment',
  offensive_content:   'Offensive content',
  inappropriate_photo: 'Inappropriate photo',
  fake_account:        'Fake account',
  privacy_concern:     'Privacy concern',
  other:               'Other',
}

// ── ReportCard ────────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: ReportRow }) {
  const [showActions, setShowActions] = useState(false)
  const [notes,       setNotes]       = useState('')
  const moderate = useModerationAction()

  const st = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.open

  const doStatus = (status: string) =>
    moderate.mutateAsync({ action: 'update_status', reportId: report.id, status, notes: notes.trim() || undefined })

  const doUserAction = (action: 'suspend' | 'ban' | 'restore') =>
    report.reported_user_id &&
    moderate.mutateAsync({ action, targetUserId: report.reported_user_id, notes: notes.trim() || undefined })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT_BODY, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 6, padding: '2px 8px' }}>
              {report.report_type}
            </span>
            <span style={{ fontSize: 12, fontFamily: FONT_BODY, color: TEXT }}>
              {REASON_LABELS[report.reason] ?? report.reason}
            </span>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>
              {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {report.description && (
            <p style={{ margin: 0, fontSize: 13, color: TEXT, fontFamily: FONT_BODY, lineHeight: 1.6, fontStyle: 'italic' }}>
              "{report.description}"
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            {report.reporter_id && (
              <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>Reporter: <code style={{ fontSize: 10 }}>{report.reporter_id.slice(0, 8)}…</code></span>
            )}
            {report.reported_user_id && (
              <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>Reported user: <code style={{ fontSize: 10 }}>{report.reported_user_id.slice(0, 8)}…</code></span>
            )}
            {report.reported_content_id && (
              <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>Content: <code style={{ fontSize: 10 }}>{report.reported_content_id.slice(0, 8)}…</code></span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_BODY, color: st.color, background: st.bg, borderRadius: 6, padding: '3px 9px' }}>
            {st.label}
          </span>
          <button
            onClick={() => setShowActions(v => !v)}
            style={{ fontSize: 12, fontFamily: FONT_BODY, color: 'var(--t-primary)', background: 'none', border: '1px solid var(--t-primary)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
          >
            {showActions ? 'Close' : 'Actions'}
          </button>
        </div>
      </div>

      {/* Action panel */}
      {showActions && (
        <div style={{ padding: '14px 16px', background: '#F9FAFB' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes (optional)</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add moderation notes…"
              rows={2}
              style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: FONT_BODY, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Report status</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {['under_review', 'resolved', 'dismissed'].map(s => (
              <button
                key={s}
                onClick={() => doStatus(s)}
                disabled={moderate.isPending || report.status === s}
                style={{
                  background:  report.status === s ? STATUS_CONFIG[s].bg : WHITE,
                  color:       STATUS_CONFIG[s].color,
                  border:      `1px solid ${STATUS_CONFIG[s].color}44`,
                  borderRadius: 8, padding: '5px 12px', cursor: report.status === s ? 'default' : 'pointer',
                  fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600,
                  opacity: moderate.isPending ? 0.6 : 1,
                }}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {report.reported_user_id && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>User actions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button
                  onClick={() => doUserAction('suspend')}
                  disabled={moderate.isPending}
                  style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600, opacity: moderate.isPending ? 0.6 : 1 }}
                >
                  Suspend 7 days
                </button>
                <button
                  onClick={() => doUserAction('ban')}
                  disabled={moderate.isPending}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600, opacity: moderate.isPending ? 0.6 : 1 }}
                >
                  Ban account
                </button>
                <button
                  onClick={() => doUserAction('restore')}
                  disabled={moderate.isPending}
                  style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600, opacity: moderate.isPending ? 0.6 : 1 }}
                >
                  Restore account
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── AdminReportsPage ──────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',         label: 'All' },
  { value: 'open',        label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'dismissed',   label: 'Dismissed' },
]

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin()
  const { data: reports = [], isLoading, error } = useReports(statusFilter)

  if (checkingAdmin) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: MUTED, fontFamily: FONT_BODY }}>Checking permissions…</div>
  )

  if (!isAdmin) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>Access denied</div>
      <div style={{ fontSize: 14, color: MUTED, fontFamily: FONT_BODY }}>You don't have admin privileges.</div>
    </div>
  )

  const openCount = reports.filter(r => r.status === 'open').length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            Moderation Queue
          </h1>
          {openCount > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 20, padding: '2px 10px', fontFamily: FONT_BODY }}>
              {openCount} open
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
          Review reported content and take moderation actions.
        </p>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_FILTERS.map(f => {
          const active = statusFilter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                fontWeight: active ? 700 : 400, fontFamily: FONT_BODY,
                border: `1.5px solid ${active ? 'var(--t-primary)' : BORDER}`,
                background: active ? 'var(--t-bg)' : WHITE,
                color: active ? 'var(--t-primary)' : MUTED,
                transition: 'all 0.12s',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#DC2626', fontFamily: FONT_BODY }}>
          Failed to load reports. You may not have admin access.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ height: 80, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && reports.length === 0 && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY2, fontFamily: FONT_DISPLAY, marginBottom: 4 }}>
            {statusFilter === 'all' ? 'No reports yet' : `No ${statusFilter.replace('_', ' ')} reports`}
          </div>
          <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>The queue is clear.</div>
        </div>
      )}

      {/* Report list */}
      {!isLoading && reports.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!isLoading && reports.length > 0 && (
        <div style={{ marginTop: 24, padding: '16px 20px', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {['open', 'under_review', 'resolved', 'dismissed'].map(s => {
            const count = reports.filter(r => r.status === s).length
            const cfg = STATUS_CONFIG[s]
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{count}</span>
                <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>{cfg.label}</span>
              </div>
            )
          })}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
            {reports.length} total · showing {statusFilter === 'all' ? 'all' : statusFilter.replace('_', ' ')}
          </div>
        </div>
      )}
    </div>
  )
}
