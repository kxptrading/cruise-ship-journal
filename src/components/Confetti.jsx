// ─────────────────────────────────────────────────────────────────────────────
// components/Confetti.jsx — Canvas confetti burst for voyage completion
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'

const COLORS = [
  '#0EA5E9', '#F59E0B', '#10B981', '#EC4899',
  '#8B5CF6', '#F97316', '#EF4444', '#14B8A6',
]

// Shapes: rectangle (streamer), circle, triangle
function drawParticle(ctx, p) {
  ctx.save()
  ctx.globalAlpha = p.opacity
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)
  ctx.fillStyle = p.color

  if (p.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.shape === 'triangle') {
    const s = p.size * 0.7
    ctx.beginPath()
    ctx.moveTo(0, -s)
    ctx.lineTo(s * 0.866, s * 0.5)
    ctx.lineTo(-s * 0.866, s * 0.5)
    ctx.closePath()
    ctx.fill()
  } else {
    // Streamer rectangle — wide and thin
    ctx.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5)
  }
  ctx.restore()
}

export default function Confetti({ active }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Fill the full viewport
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const shapes = ['rect', 'circle', 'triangle']

    // Launch particles from several points across the top
    const particles = Array.from({ length: 180 }, (_, i) => ({
      x:             (Math.random() * 1.4 - 0.2) * canvas.width,
      y:             -20,
      vx:            (Math.random() - 0.5) * 9,
      vy:            Math.random() * 5 + 1,
      rotation:      Math.random() * Math.PI * 2,
      rotSpeed:      (Math.random() - 0.5) * 0.25,
      color:         COLORS[i % COLORS.length],
      size:          Math.random() * 9 + 5,
      shape:         shapes[Math.floor(Math.random() * shapes.length)],
      opacity:       1,
      wobble:        Math.random() * Math.PI * 2,
      wobbleSpeed:   Math.random() * 0.08 + 0.04,
    }))

    const DURATION = 240  // frames (~4 s at 60 fps)
    let frame = 0

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      particles.forEach(p => {
        p.wobble  += p.wobbleSpeed
        p.x       += p.vx + Math.sin(p.wobble) * 0.8
        p.y       += p.vy
        p.vy      += 0.09          // gravity
        p.rotation += p.rotSpeed
        p.opacity  = Math.max(0, 1 - frame / DURATION)
        drawParticle(ctx, p)
      })

      if (frame < DURATION) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        pointerEvents: 'none',
        width: '100%', height: '100%',
      }}
    />
  )
}
