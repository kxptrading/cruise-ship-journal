import LegalPage from './legal/LegalPage'

const TOC = [
  { id: 'commitment',   label: '1. Our Commitment' },
  { id: 'standards',    label: '2. Standards' },
  { id: 'features',     label: '3. Accessibility Features' },
  { id: 'limitations',  label: '4. Known Limitations' },
  { id: 'feedback',     label: '5. Feedback & Contact' },
]

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility Statement" badge="Trust" lastUpdated="June 2026" toc={TOC}>

      <section id="commitment">
        <h2>1. Our Commitment</h2>
        <p>
          KXP Technologies is committed to making Deck Days accessible to all users, including those
          with disabilities. We believe that everyone should be able to document and share their cruise
          memories, regardless of ability.
        </p>
        <p>
          We are actively working to ensure Deck Days conforms to accessibility best practices.
          This statement describes our current status, known limitations, and how you can provide feedback.
        </p>
      </section>

      <section id="standards">
        <h2>2. Standards</h2>
        <p>
          We aim to meet the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>
          as our target standard. This is consistent with the guidelines referenced by the UK
          Government's accessibility requirements.
        </p>
        <p>
          Our current accessibility status is: <strong>Partially conformant</strong>. Some areas do
          not yet meet Level AA due to the complexity of certain features and resource constraints.
          We are working to address these progressively.
        </p>
      </section>

      <section id="features">
        <h2>3. Accessibility Features</h2>
        <p>Deck Days currently includes the following accessibility measures:</p>
        <ul>
          <li><strong>Keyboard navigation</strong> — core interactive elements are keyboard accessible using Tab and Enter.</li>
          <li><strong>Focus indicators</strong> — visible focus outlines are applied to interactive elements for keyboard users.</li>
          <li><strong>Focus traps</strong> — mobile navigation drawers use focus trapping to prevent keyboard focus escaping the modal.</li>
          <li><strong>Reduced motion</strong> — Deck Days respects the operating system's "Reduce Motion" preference, disabling non-essential animations.</li>
          <li><strong>Semantic HTML</strong> — we use appropriate heading hierarchy, ARIA roles, and landmark elements throughout.</li>
          <li><strong>Alternative text</strong> — user-uploaded images are displayed with alt text where captions are provided.</li>
          <li><strong>Responsive layout</strong> — the application adapts to mobile, tablet, and desktop screen sizes.</li>
          <li><strong>ARIA labels</strong> — icon-only buttons include ARIA labels for screen reader users.</li>
          <li><strong>Colour contrast</strong> — we aim for sufficient contrast ratios on all primary text and interactive elements.</li>
        </ul>
      </section>

      <section id="limitations">
        <h2>4. Known Limitations</h2>
        <p>
          We are aware of the following limitations and are working to address them:
        </p>
        <ul>
          <li>
            <strong>Photo lightbox / swipe gallery</strong> — the photo lightbox may not be fully
            accessible to screen reader users. We plan to improve this in a future update.
          </li>
          <li>
            <strong>Custom drag-and-drop components</strong> — the itinerary drag-to-reorder feature
            requires a mouse or touch input. Keyboard-accessible reordering is planned.
          </li>
          <li>
            <strong>Emoji rendering</strong> — some emoji used for visual decoration may not be
            read meaningfully by all screen readers.
          </li>
          <li>
            <strong>Third-party components</strong> — some UI components use third-party libraries
            that may not fully meet WCAG standards.
          </li>
          <li>
            <strong>PDF export</strong> — the planned PDF export feature has not yet been
            assessed for accessibility.
          </li>
        </ul>
      </section>

      <section id="feedback">
        <h2>5. Feedback &amp; Contact</h2>
        <p>
          If you experience an accessibility barrier on Deck Days, or if you cannot access part of
          the application, please let us know. We take all feedback seriously and will respond within
          5 business days.
        </p>
        <p>
          <strong>Email:</strong> <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a><br />
          <strong>Subject:</strong> Accessibility Issue
        </p>
        <p>
          Please describe the issue, the page or feature where it occurs, and the assistive technology
          or browser you are using. We will prioritise the fix based on severity.
        </p>
        <p>
          This statement was prepared in June 2026 and will be reviewed annually or when significant
          changes are made to the application.
        </p>
      </section>

    </LegalPage>
  )
}
