// Shared layout for all legal/help pages.
// Renders: dark header card, optional sticky TOC sidebar, content card with legal typography.

import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { NAVY2, GOLD, WHITE, BORDER, MUTED, FONT_BODY } from '@/constants'

export interface TocItem { id: string; label: string }

interface Props {
  title: string
  badge?: string
  lastUpdated?: string
  toc?: TocItem[]
  children: ReactNode
}

export default function LegalPage({ title, badge = 'Legal', lastUpdated, toc, children }: Props) {
  const navigate  = useNavigate()
  const [wide, setWide] = useState(() => window.innerWidth >= 820)

  useEffect(() => {
    const fn = () => setWide(window.innerWidth >= 820)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header card */}
      <div style={{
        background: NAVY2, borderRadius: 16, padding: wide ? '24px 32px 28px' : '20px 20px 24px',
        marginBottom: 24,
      }}>
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, padding: 0, marginBottom: 14,
          }}
        >
          <ArrowLeft size={13} /> Back
        </button>

        {badge && (
          <div style={{ fontSize: 9, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: FONT_BODY, marginBottom: 5 }}>
            {badge}
          </div>
        )}
        <h1 style={{ margin: 0, fontSize: wide ? 26 : 22, fontWeight: 400, color: WHITE, fontFamily: 'Georgia, serif', lineHeight: 1.2 }}>
          {title}
        </h1>
        {lastUpdated && (
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: FONT_BODY }}>
            Last updated: {lastUpdated}
          </p>
        )}
      </div>

      {/* Two-column layout: content + TOC */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {/* Main content */}
        <article
          className="legal-content"
          style={{
            flex: 1, minWidth: 0,
            background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`,
            padding: wide ? '32px 40px' : '22px 20px',
          }}
        >
          {children}
        </article>

        {/* TOC — desktop only */}
        {wide && toc && toc.length > 0 && (
          <nav aria-label="Page contents" style={{ width: 176, flexShrink: 0, position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY, marginBottom: 10 }}>
              On this page
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {toc.map(item => (
                <button
                  key={item.id}
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '5px 8px 5px 0', fontSize: 12.5, color: MUTED,
                    fontFamily: FONT_BODY, lineHeight: 1.4, transition: 'color 0.12s',
                    borderLeft: '2px solid transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = NAVY2; e.currentTarget.style.borderLeftColor = GOLD }}
                  onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderLeftColor = 'transparent' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
