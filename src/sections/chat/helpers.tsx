// Shared helpers and mini-components used across the Chat sub-files.

import { NAVY2, WHITE, GOLD, FONT_BODY } from '../../constants'

export function fmtTime(ts: string | null | undefined): string {
  if (!ts) return ''
  const d   = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return 'Yesterday'
  if (diff < 604800000) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function fmtFull(ts: string | null | undefined): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function fmtDateLabel(ts: string): string {
  const d   = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yest = new Date(now); yest.setDate(yest.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function getInitials(name: string | null | undefined): string {
  const words = (name || '?').trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  return (words[0] || '?').slice(0, 2).toUpperCase()
}

interface AvatarProps {
  url?:      string | null
  name?:     string | null
  size?:     number
  fontSize?: number
}

export function Avatar({ url, name, size = 36, fontSize = 13 }: AvatarProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: NAVY2, flexShrink: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>{getInitials(name)}</span>
      }
    </div>
  )
}

interface GroupIconProps {
  size?: number
}

export function GroupIcon({ size = 36 }: GroupIconProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${GOLD}, #F97316)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.45),
    }}>👥</div>
  )
}
