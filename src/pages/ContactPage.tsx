import LegalPage from './legal/LegalPage'
import { NAVY2, GOLD, WHITE, BORDER, FONT_BODY } from '@/constants'

const TOPICS = [
  { icon: '🔒', label: 'Privacy & Data', note: 'Data requests, deletion, GDPR enquiries', email: 'kiran.x.parmar@gmail.com', subject: 'Privacy Enquiry' },
  { icon: '🛡️', label: 'Safety & Reporting', note: 'Content reports, account concerns, trust issues', email: 'kiran.x.parmar@gmail.com', subject: 'Safety Report' },
  { icon: '🐛', label: 'Bug Reports', note: 'Technical issues, errors, unexpected behaviour', email: 'kiran.x.parmar@gmail.com', subject: 'Bug Report' },
  { icon: '💡', label: 'Feature Requests', note: 'Suggestions and ideas for Deck Days', email: 'kiran.x.parmar@gmail.com', subject: 'Feature Request' },
  { icon: '⚖️', label: 'Legal & Copyright', note: 'Copyright takedowns, legal notices', email: 'kiran.x.parmar@gmail.com', subject: 'Legal Enquiry' },
  { icon: '🤝', label: 'General Enquiries', note: 'Anything else — we are happy to help', email: 'kiran.x.parmar@gmail.com', subject: 'General Enquiry' },
]

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us" badge="Support" lastUpdated="June 2026">

      <p style={{ marginBottom: 24 }}>
        Deck Days is operated by <strong>KXP Technologies</strong> (Kiran Parmar), UK.
        We aim to respond to all enquiries within <strong>2 business days</strong>.
      </p>

      {/* Contact cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 32 }}>
        {TOPICS.map(topic => (
          <a
            key={topic.label}
            href={`mailto:${topic.email}?subject=${encodeURIComponent(topic.subject)}`}
            style={{
              display: 'block', padding: '16px 18px',
              background: '#F9F7F3', border: `1px solid ${BORDER}`,
              borderRadius: 12, textDecoration: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = GOLD
              el.style.boxShadow = `0 2px 12px ${GOLD}22`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = BORDER
              el.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{topic.icon}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY, marginBottom: 4 }}>{topic.label}</div>
            <div style={{ fontSize: 12, color: '#7A8594', fontFamily: FONT_BODY, lineHeight: 1.5 }}>{topic.note}</div>
          </a>
        ))}
      </div>

      {/* Main contact block */}
      <div style={{ background: NAVY2, borderRadius: 14, padding: '24px 28px', color: WHITE }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: `${GOLD}`, marginBottom: 6, fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Primary Contact
        </div>
        <div style={{ fontSize: 22, fontWeight: 400, fontFamily: 'Georgia, serif', marginBottom: 4 }}>
          kiran.x.parmar@gmail.com
        </div>
        <a
          href="mailto:kiran.x.parmar@gmail.com"
          style={{
            display: 'inline-block', marginTop: 12,
            background: GOLD, color: '#1C2B3A',
            padding: '8px 20px', borderRadius: 8,
            fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY,
            textDecoration: 'none', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
        >
          Send Email
        </a>
      </div>

      {/* Additional info */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 400, fontFamily: 'Georgia, serif', color: NAVY2, marginBottom: 12, borderBottom: `1px solid ${BORDER}`, paddingBottom: 8 }}>
          Response Times
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, fontFamily: FONT_BODY }}>
          <tbody>
            {[
              ['General enquiries', '2 business days'],
              ['Safety & child protection', 'Same day (urgent cases prioritised)'],
              ['Privacy / data requests', '30 days (UK GDPR legal maximum)'],
              ['Bug reports', '2–5 business days'],
              ['Copyright takedowns', '5 business days'],
            ].map(([topic, time]) => (
              <tr key={topic}>
                <td style={{ padding: '8px 0', borderBottom: `1px solid ${BORDER}`, color: '#1C2B3A' }}>{topic}</td>
                <td style={{ padding: '8px 0', borderBottom: `1px solid ${BORDER}`, color: '#7A8594', textAlign: 'right' }}>{time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: '#7A8594', fontFamily: FONT_BODY, lineHeight: 1.6 }}>
        <strong>Deck Days</strong> is an independent cruise journal app operated by KXP Technologies and is
        not affiliated with any cruise line, travel agent, or booking platform.
      </p>

    </LegalPage>
  )
}
