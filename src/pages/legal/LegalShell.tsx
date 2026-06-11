// Standalone wrapper for legal/help pages when the user is not authenticated.
// Provides a branded header and footer without requiring the full app shell.

import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NAVY2, GOLD, WHITE, BORDER, MUTED, CREAM, FONT_BODY, FONT_LOGO } from '@/constants'

const YEAR = new Date().getFullYear()

interface Props { children: ReactNode }

export default function LegalShell({ children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: CREAM, display: 'flex', flexDirection: 'column' }}>
      {/* Branded header */}
      <header style={{
        background: NAVY2, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.svg" alt="Deck Days" style={{ height: 38, width: 'auto', opacity: 0.9 }} />
        </Link>
        <Link
          to="/login"
          style={{
            fontSize: 12.5, fontFamily: FONT_BODY, fontWeight: 600,
            color: WHITE, background: `${GOLD}22`, border: `1px solid ${GOLD}55`,
            borderRadius: 8, padding: '6px 14px', textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${GOLD}33` }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${GOLD}22` }}
        >
          Sign In
        </Link>
      </header>

      {/* Page content */}
      <main style={{ flex: 1, padding: '32px 20px 60px', maxWidth: 920, margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      {/* Minimal footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '16px 24px', fontFamily: FONT_BODY, background: WHITE }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 8 }}>
          {[
            ['Terms of Service', '/legal/terms'],
            ['Privacy Policy', '/legal/privacy'],
            ['Cookie Policy', '/legal/cookies'],
            ['Community Guidelines', '/legal/community-guidelines'],
            ['Help', '/help'],
          ].map(([label, href]) => (
            <Link
              key={href}
              to={href}
              style={{ fontSize: 12, color: MUTED, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = NAVY2 }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = MUTED }}
            >
              {label}
            </Link>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: MUTED, margin: 0 }}>
          © {YEAR} Deck Days · KXP Technologies. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
