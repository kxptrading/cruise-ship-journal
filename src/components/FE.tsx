// ─────────────────────────────────────────────────────────────────────────────
// components/FE.tsx — Microsoft Fluent Emoji renderer
//
// Renders emoji as flat SVG images from Microsoft's Fluent Emoji set via unpkg.
// Falls back to the native text emoji if the image fails to load.
//
// URL pattern: https://unpkg.com/@lobehub/fluent-emoji-flat@latest/assets/{hex}.svg
// where {hex} is the emoji codepoints joined with '-' (e.g. 1f602, 1f4b3-fe0f)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

function emojiToHex(emoji: string): string {
  return [...emoji]
    .map(c => c.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-')
}

function fluentUrl(emoji: string): string {
  const hex = emojiToHex(emoji)
  return `https://unpkg.com/@lobehub/fluent-emoji-flat@latest/assets/${hex}.svg`
}

interface FEProps {
  emoji: string
  size?: number
}

export default function FE({ emoji, size = 24 }: FEProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
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
