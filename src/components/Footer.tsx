// components/Footer.tsx — Site footer: social icons, three-column legal/support links, copyright
import { Link } from 'react-router-dom'
import { BORDER, MUTED, WHITE, FONT_BODY } from '../constants'

const YEAR = new Date().getFullYear()

const SocialIcon = ({ path }: { path: string }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={path} />
  </svg>
)

const SOCIAL = [
  {
    label: 'Instagram',
    href:  'https://instagram.com/kxptechnologies',
    icon:  'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  {
    label: 'X (Twitter)',
    href:  'https://x.com/kxptechnologies',
    icon:  'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'LinkedIn',
    href:  'https://linkedin.com/company/kxptechnologies',
    icon:  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
]

const FOOTER_COLS = [
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service',       to: '/legal/terms' },
      { label: 'Privacy Policy',          to: '/legal/privacy' },
      { label: 'Cookie Policy',           to: '/legal/cookies' },
      { label: 'Acceptable Use',          to: '/legal/acceptable-use' },
      { label: 'Community Guidelines',    to: '/legal/community-guidelines' },
      { label: 'Content Policy',          to: '/legal/content-policy' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help & FAQ',              to: '/help' },
      { label: 'Safety & Reporting',      to: '/safety' },
      { label: 'Delete Account',          to: '/delete-account' },
      { label: 'Contact',                 to: '/contact' },
    ],
  },
  {
    heading: 'Trust',
    links: [
      { label: 'Accessibility',           to: '/accessibility' },
      { label: 'Family Safety',           to: '/family-safety' },
    ],
  },
]

const linkStyle: React.CSSProperties = {
  fontSize: 12,
  color: MUTED,
  textDecoration: 'none',
  display: 'block',
  padding: '2px 0',
  transition: 'color 0.13s',
  fontFamily: FONT_BODY,
  lineHeight: 1.6,
}

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{ borderTop: `1px solid ${BORDER}`, background: WHITE, fontFamily: FONT_BODY }}
    >
      {/* Three-column link grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 24px', padding: '20px 28px 16px' }}>
        {FOOTER_COLS.map(col => (
          <div key={col.heading}>
            <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {col.heading}
            </div>
            {col.links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={linkStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--t-primary-dk)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = MUTED }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Social icons + copyright */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
          © {YEAR} Deck Days · KXP Technologies. All rights reserved. Not affiliated with any cruise line.
        </p>
        <div style={{ display: 'flex', gap: 14 }}>
          {SOCIAL.map(({ label, href, icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              style={{ color: MUTED, transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--t-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = MUTED }}
            >
              <SocialIcon path={icon} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
