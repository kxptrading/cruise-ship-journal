// ─────────────────────────────────────────────────────────────────────────────
// components/FE.tsx — Unified icon renderer
//
// Renders icons in the style selected by the user's icon pack preference:
//   fluent  — Microsoft Fluent Emoji SVGs via unpkg CDN (default)
//   native  — plain system/device emoji
//   lucide  — Lucide React SVG line icons; falls back to native for unmapped emoji
//
// URL pattern: https://unpkg.com/@lobehub/fluent-emoji-flat@latest/assets/{hex}.svg
// where {hex} is the emoji codepoints joined with '-' (e.g. 1f602, 1f4b3-fe0f)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useIconPack } from '../context'
import type { LucideIcon } from 'lucide-react'
import {
  Anchor, AlertTriangle, Bell, BookOpen, Calendar, CalendarDays,
  Camera, Compass, CreditCard, DollarSign, DoorOpen, FileText,
  FolderOpen, Globe, Hand, Image, Lock, Luggage, Map, MapPin,
  MessageCircle, Moon, Music, Pencil, PencilLine, Plus, Radio,
  Rss, Search, Ship, ShoppingBag, Sparkles, Star, Sunrise, Timer,
  Trophy, User, Users, Utensils, UtensilsCrossed, Waves, CloudSun,
} from 'lucide-react'

// Maps every emoji used in the app to its Lucide equivalent.
// Emoji without an entry fall back to native text rendering.
const LUCIDE_MAP: Record<string, LucideIcon> = {
  '📅': CalendarDays,
  '🗓':  Calendar,
  '🗺️': Map,
  '📍': MapPin,
  '🚢': Ship,
  '⛵': Ship,
  '🚤': Ship,
  '⚓': Anchor,
  '🧭': Compass,
  '🌊': Waves,
  '🌅': Sunrise,
  '🌙': Moon,
  '🌤️': CloudSun,
  '🍴': Utensils,
  '🍽️': UtensilsCrossed,
  '🎭': Music,
  '⭐': Star,
  '✨': Sparkles,
  '💳': CreditCard,
  '💰': DollarSign,
  '🛍️': ShoppingBag,
  '🏆': Trophy,
  '🧳': Luggage,
  '📝': FileText,
  '📖': BookOpen,
  '✍️': PencilLine,
  '✏️': Pencil,
  '👥': Users,
  '💬': MessageCircle,
  '🔍': Search,
  '🔒': Lock,
  '🔔': Bell,
  '🌐': Globe,
  '📷': Camera,
  '📸': Camera,
  '🖼️': Image,
  '🗂️': FolderOpen,
  '📡': Radio,
  '⚠️': AlertTriangle,
  '⏱':  Timer,
  '👋': Hand,
  '🚪': DoorOpen,
  '👤': User,
  '📻': Rss,
  '+':  Plus,
}

function emojiToHex(emoji: string): string {
  return [...emoji]
    .map(c => c.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-')
}

function fluentUrl(emoji: string): string {
  return `https://unpkg.com/@lobehub/fluent-emoji-flat@latest/assets/${emojiToHex(emoji)}.svg`
}

interface FEProps {
  emoji:      string
  size?:      number
  forceMode?: 'fluent' | 'native' | 'lucide'  // overrides context — use for previews
}

export default function FE({ emoji, size = 36, forceMode }: FEProps) {
  const iconPack = forceMode ?? useIconPack()
  const [failed, setFailed] = useState(false)

  if (iconPack === 'lucide') {
    const LucideIcon = LUCIDE_MAP[emoji]
    if (LucideIcon) {
      return <LucideIcon size={size} strokeWidth={1.75} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
    }
    // No mapping — fall through to native
    return (
      <span style={{ fontSize: size * 0.75, lineHeight: 1, display: 'inline-block', verticalAlign: 'middle' }}>
        {emoji}
      </span>
    )
  }

  if (iconPack === 'native' || failed) {
    return (
      <span style={{ fontSize: size, lineHeight: 1, display: 'inline-block', verticalAlign: 'middle' }}>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={fluentUrl(emoji)}
      alt={emoji}
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  )
}
