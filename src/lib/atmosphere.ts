// ─────────────────────────────────────────────────────────────────────────────
// lib/atmosphere.ts — Time-of-day theming + ship horn sound
// ─────────────────────────────────────────────────────────────────────────────

export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night'

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 5  && h < 9)  return 'dawn'
  if (h >= 9  && h < 18) return 'day'
  if (h >= 18 && h < 21) return 'sunset'
  return 'night'
}

export function getTimeGradient(tod: TimeOfDay): string | null {
  switch (tod) {
    case 'dawn':
      return 'linear-gradient(160deg, #FFDDE1 0%, #FAB8B8 25%, #FFD4A1 65%, #FFF3CD 100%)'
    case 'sunset':
      return 'linear-gradient(160deg, #C94B4B 0%, #E8703A 28%, #F4A93D 55%, #9B4DCA 82%, #4A1980 100%)'
    case 'night':
      return 'linear-gradient(160deg, #0A0A1A 0%, #0D1B3E 45%, #162447 75%, #0A1628 100%)'
    default:
      return null
  }
}

export function getVignetteRGB(tod: TimeOfDay): [number, number, number] {
  switch (tod) {
    case 'dawn':   return [180, 60,  60]
    case 'sunset': return [100, 30,  10]
    case 'night':  return [5,   5,   20]
    default:       return [3,   50, 100]
  }
}

export function playShipHorn(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext as typeof AudioContext | undefined
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const osc1   = ctx.createOscillator()
    const osc2   = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain   = ctx.createGain()

    filter.type            = 'lowpass'
    filter.frequency.value = 550
    filter.Q.value         = 3

    osc1.type            = 'sawtooth'
    osc1.frequency.value = 87
    osc2.type            = 'sawtooth'
    osc2.frequency.value = 90

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    const t = ctx.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.45, t + 0.25)
    gain.gain.setValueAtTime(0.42, t + 2.0)
    gain.gain.linearRampToValueAtTime(0, t + 2.7)

    osc1.start(t); osc2.start(t)
    osc1.stop(t + 3); osc2.stop(t + 3)

    setTimeout(() => ctx.close(), 4000)
  } catch (_e) {
    // Audio unavailable — fail silently
  }
}
