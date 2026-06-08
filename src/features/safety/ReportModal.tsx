// features/safety/ReportModal.tsx — Report content or user modal

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { WHITE, BORDER, NAVY2, MUTED, FONT_DISPLAY, FONT_BODY, TEXT } from '@/constants'
import { useReport } from './hooks'
import type { ReportPayload } from './hooks'

const REASONS = [
  { value: 'spam',                label: 'Spam or unwanted content' },
  { value: 'harassment',          label: 'Harassment or bullying' },
  { value: 'offensive_content',   label: 'Offensive or hateful content' },
  { value: 'inappropriate_photo', label: 'Inappropriate photo' },
  { value: 'fake_account',        label: 'Fake or impersonation account' },
  { value: 'privacy_concern',     label: 'Privacy concern' },
  { value: 'other',               label: 'Other' },
]

interface Props {
  reportType:          ReportPayload['reportType']
  reportedUserId?:     string
  reportedContentId?:  string
  onClose:             () => void
  onSuccess?:          () => void
}

export default function ReportModal({ reportType, reportedUserId, reportedContentId, onClose, onSuccess }: Props) {
  const [reason,      setReason]      = useState('')
  const [description, setDescription] = useState('')
  const [submitted,   setSubmitted]   = useState(false)
  const report = useReport()

  const handleSubmit = async () => {
    if (!reason) return
    await report.mutateAsync({
      reportedUserId,
      reportedContentId,
      reportType,
      reason,
      description: description.trim() || undefined,
    })
    setSubmitted(true)
    setTimeout(() => { onSuccess?.(); onClose() }, 1800)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 340 }}
          onClick={e => e.stopPropagation()}
          style={{ background: WHITE, borderRadius: 20, padding: '24px', maxWidth: 420, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: NAVY2, fontFamily: FONT_DISPLAY, marginBottom: 6 }}>Report received</div>
              <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>Thank you. Our team will review this shortly.</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 400, color: NAVY2 }}>
                  Report {reportType}
                </h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Reason</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {REASONS.map(r => (
                    <label
                      key={r.value}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1.5px solid ${reason === r.value ? NAVY2 : BORDER}`, borderRadius: 10, cursor: 'pointer', background: reason === r.value ? '#F8FAFF' : WHITE, transition: 'all 0.12s' }}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        style={{ accentColor: NAVY2 }}
                      />
                      <span style={{ fontSize: 13, color: TEXT, fontFamily: FONT_BODY }}>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Additional details (optional)</div>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell us more about the issue…"
                  rows={3}
                  style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, fontFamily: FONT_BODY, resize: 'none', outline: 'none', color: TEXT, lineHeight: 1.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reason || report.isPending}
                  style={{ background: '#DC2626', color: WHITE, border: 'none', borderRadius: 10, padding: '8px 18px', cursor: reason && !report.isPending ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY, opacity: !reason || report.isPending ? 0.5 : 1 }}
                >
                  {report.isPending ? 'Sending…' : 'Submit report'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
