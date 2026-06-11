import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import LegalPage from './legal/LegalPage'
import { NAVY2, NAVY, GOLD, BORDER, CREAM, FONT_BODY } from '@/constants'

const FAQS: { q: string; a: string | string[] }[] = [
  {
    q: 'What is Deck Days?',
    a: 'Deck Days is a cruise voyage journal app. You can record your day-by-day experiences, track ports, log meals, manage your budget, and document memories — all organised by voyage. There\'s also an optional social feed where you can share selected posts with family and friends.',
  },
  {
    q: 'Is Deck Days free?',
    a: 'Deck Days is currently free to use. All core journalling features are available at no cost.',
  },
  {
    q: 'Can I keep my journal private?',
    a: 'Yes. By default, all your journal entries are completely private and only visible to you. Only posts you explicitly mark as "Family" or "Public" are shared with others.',
  },
  {
    q: 'How do I share posts with family and friends?',
    a: [
      'When creating a post, choose the audience — Private, Family, or Public.',
      'Family posts are visible to contacts you have approved as family connections.',
      'Public posts are visible to all your contacts.',
      'You can manage your contacts from the People section.',
    ],
  },
  {
    q: 'Can I upload photos?',
    a: 'Yes. You can upload photos to your daily journal entries and posts. Photos are stored securely and privately by default. Only photos attached to shared posts are visible to your contacts.',
  },
  {
    q: 'Can I use Deck Days offline?',
    a: 'Deck Days has partial offline support — you can view cached content while offline. Full offline write-through sync (editing entries without an internet connection) is being developed as a future feature.',
  },
  {
    q: 'How do I switch between voyages?',
    a: 'Go to the Voyages section from the sidebar. Select any voyage to open it. You can create as many voyages as you like — past, present, or future.',
  },
  {
    q: 'Can I create a voyage for a future cruise?',
    a: 'Yes. You can set up a voyage with your departure date, ship, ports, and itinerary in advance. The dashboard will count down to your departure and track your progress once you\'re on board.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Visit the Delete Account page from Settings, or go to deckdays.app/delete-account. Full account and data deletion instructions are there. Your data is permanently deleted within 90 days.',
  },
  {
    q: 'How do I report inappropriate content?',
    a: 'Use the report button on any post or user profile in the app. Our safety team reviews all reports. For urgent concerns, email kiran.x.parmar@gmail.com. See our Safety & Reporting page for full details.',
  },
  {
    q: 'How is my data protected?',
    a: 'Your data is stored securely on Supabase (encrypted in transit and at rest). Private journal entries are never shared with other users. See our Privacy Policy for full details on how we handle your data.',
  },
  {
    q: 'Which devices does Deck Days work on?',
    a: 'Deck Days is a web app that works in any modern browser on desktop, tablet, or smartphone. It\'s optimised for mobile use. An installable PWA version is available — add it to your home screen from your browser\'s "Add to Home Screen" option.',
  },
  {
    q: 'Can I export my journal data?',
    a: 'Data export is on our roadmap. In the meantime, if you would like a copy of your data, contact us at kiran.x.parmar@gmail.com and we will assist you.',
  },
  {
    q: 'I have a question not answered here. How do I get in touch?',
    a: 'Email us at kiran.x.parmar@gmail.com — we\'re happy to help.',
  },
]

function FAQItem({ q, a }: { q: string; a: string | string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '16px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: NAVY2,
        }}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          size={16}
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', color: GOLD }}
        />
      </button>
      {open && (
        <div style={{ paddingBottom: 16, fontSize: 14, color: '#4A5568', fontFamily: FONT_BODY, lineHeight: 1.7 }}>
          {Array.isArray(a) ? (
            <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
              {a.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>{a}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <LegalPage title="Help & FAQ" badge="Support" lastUpdated="June 2026">
      <p style={{ marginBottom: 24, color: '#4A5568', fontSize: 14.5, fontFamily: FONT_BODY }}>
        Answers to common questions about Deck Days. Can't find what you need?
        Email us at <a href="mailto:kiran.x.parmar@gmail.com" style={{ color: NAVY }}>kiran.x.parmar@gmail.com</a>.
      </p>
      <div>
        {FAQS.map((faq, i) => <FAQItem key={i} {...faq} />)}
      </div>
    </LegalPage>
  )
}
