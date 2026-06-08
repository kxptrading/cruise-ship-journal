// features/safety/UserSafetyMenu.tsx — ⋯ menu for reporting, blocking, muting

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal, Flag, VolumeX, Ban } from 'lucide-react'
import { WHITE, BORDER, MUTED, FONT_BODY, TEXT } from '@/constants'
import { useMyBlocks, useMyMutes, useBlock, useMute } from './hooks'
import ReportModal from './ReportModal'

interface Props {
  targetUserId:  string
  postId?:       string
  reportType?:   'post' | 'profile'
  variant?:      'light' | 'dark'
}

export default function UserSafetyMenu({ targetUserId, postId, reportType = 'post', variant = 'light' }: Props) {
  const [open,       setOpen]       = useState(false)
  const [showReport, setShowReport] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: blockedIds = [] } = useMyBlocks()
  const { data: mutedIds   = [] } = useMyMutes()
  const block = useBlock()
  const mute  = useMute()

  const isBlocked = blockedIds.includes(targetUserId)
  const isMuted   = mutedIds.includes(targetUserId)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
          title="More options"
          style={{
            background:   variant === 'dark' ? 'rgba(255,255,255,0.12)' : 'none',
            border:       `1px solid ${variant === 'dark' ? 'rgba(255,255,255,0.2)' : BORDER}`,
            borderRadius: 8,
            padding:      '4px 7px',
            cursor:       'pointer',
            color:        variant === 'dark' ? '#fff' : MUTED,
            display:      'flex',
            alignItems:   'center',
          }}
        >
          <MoreHorizontal size={15} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 4 }}
              transition={{ type: 'spring', damping: 22, stiffness: 380 }}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
                background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)', overflow: 'hidden', minWidth: 175,
              }}
            >
              <MenuItem
                icon={<Flag size={14} />}
                label="Report"
                onClick={() => { setOpen(false); setShowReport(true) }}
                color="#DC2626"
              />
              <MenuItem
                icon={<VolumeX size={14} />}
                label={isMuted ? 'Unmute user' : 'Mute user'}
                description={isMuted ? undefined : 'Hides from your feed'}
                onClick={() => { setOpen(false); mute.mutate({ targetId: targetUserId, isMuted }) }}
              />
              <MenuItem
                icon={<Ban size={14} />}
                label={isBlocked ? 'Unblock user' : 'Block user'}
                description={isBlocked ? undefined : 'Prevent all interaction'}
                onClick={() => { setOpen(false); block.mutate({ targetId: targetUserId, isBlocked }) }}
                color={isBlocked ? undefined : '#DC2626'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showReport && (
          <ReportModal
            reportType={reportType}
            reportedUserId={targetUserId}
            reportedContentId={postId}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── MenuItem ──────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon:         React.ReactNode
  label:        string
  description?: string
  onClick:      () => void
  color?:       string
}

function MenuItem({ icon, label, description, onClick, color }: MenuItemProps) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', background: hover ? '#F3F4F6' : 'none',
        border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ color: color ?? MUTED, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontFamily: FONT_BODY, color: color ?? TEXT }}>{label}</div>
        {description && <div style={{ fontSize: 11, fontFamily: FONT_BODY, color: MUTED, marginTop: 1 }}>{description}</div>}
      </div>
    </button>
  )
}
