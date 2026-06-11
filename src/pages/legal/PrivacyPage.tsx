import LegalPage from './LegalPage'

const TOC = [
  { id: 'about',       label: '1. About This Policy' },
  { id: 'who',         label: '2. Who We Are' },
  { id: 'collect',     label: '3. Data We Collect' },
  { id: 'use',         label: '4. How We Use Your Data' },
  { id: 'basis',       label: '5. Legal Basis (UK GDPR)' },
  { id: 'retention',   label: '6. Data Retention' },
  { id: 'sharing',     label: '7. Sharing Your Data' },
  { id: 'rights',      label: '8. Your Rights' },
  { id: 'cookies',     label: '9. Cookies' },
  { id: 'security',    label: '10. Security' },
  { id: 'children',    label: '11. Children' },
  { id: 'changes',     label: '12. Changes' },
  { id: 'contact',     label: '13. Contact & Complaints' },
]

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="June 2026" toc={TOC}>

      <section id="about">
        <h2>1. About This Policy</h2>
        <p>
          This Privacy Policy explains how KXP Technologies collects, uses, stores, and protects
          your personal data when you use Deck Days. It also explains your rights under the
          <strong> UK General Data Protection Regulation (UK GDPR)</strong> and the Data Protection Act 2018.
        </p>
        <p>
          We take your privacy seriously. Deck Days is a personal journal tool — your private voyage
          records are yours, and we only access them to deliver the service.
        </p>
      </section>

      <section id="who">
        <h2>2. Who We Are</h2>
        <p>
          The data controller is <strong>KXP Technologies</strong>, operated by Kiran Parmar, UK.
          If you have any questions about how we handle your data, please contact:
        </p>
        <p>
          <strong>Email:</strong> <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>
        </p>
        <p>
          We are not currently required to register with the Information Commissioner's Office (ICO)
          as a data controller, but we comply with the UK GDPR as a matter of principle.
        </p>
      </section>

      <section id="collect">
        <h2>3. Data We Collect</h2>

        <h3>Account data</h3>
        <ul>
          <li>Email address</li>
          <li>Display name and optional first / last name</li>
          <li>Profile photo (if uploaded)</li>
          <li>Age (optional, used to enforce content gates)</li>
          <li>Account creation date</li>
        </ul>

        <h3>Voyage and journal data</h3>
        <ul>
          <li>Voyage details: ship name, cruise line, departure and return dates, cabin, ports of call</li>
          <li>Daily journal entries: highlights, activities, ratings, notes</li>
          <li>Food logs, dining entries, entertainment logs, packing lists, budget records, shopping logs</li>
          <li>Posts and captions you write</li>
        </ul>

        <h3>Photos and media</h3>
        <ul>
          <li>Photos and images you upload to your journal or posts</li>
          <li>Metadata embedded in photos (we do not deliberately extract GPS data from EXIF)</li>
        </ul>

        <h3>Social data</h3>
        <ul>
          <li>Connections you make with other users (contacts, friend requests)</li>
          <li>Reactions and comments on shared posts</li>
          <li>Reports you make about content or users</li>
        </ul>

        <h3>Technical data</h3>
        <ul>
          <li>IP address (collected by our infrastructure providers on each request)</li>
          <li>Browser type and operating system</li>
          <li>Session authentication tokens</li>
          <li>Application preferences stored in browser local storage (theme, icon pack)</li>
        </ul>

        <p>
          We do not currently use third-party analytics (e.g. Google Analytics). We do not
          collect advertising identifiers or build advertising profiles.
        </p>
      </section>

      <section id="use">
        <h2>4. How We Use Your Data</h2>
        <ul>
          <li><strong>To provide the service</strong> — storing and displaying your journal entries and voyage data.</li>
          <li><strong>To manage your account</strong> — authentication, password resets, profile management.</li>
          <li><strong>To enable social features</strong> — sharing posts with contacts, reactions, comments.</li>
          <li><strong>To ensure security</strong> — detecting fraud, misuse, and enforcing our Terms.</li>
          <li><strong>To communicate with you</strong> — responding to support requests and sending service-critical notifications.</li>
          <li><strong>To improve Deck Days</strong> — understanding how features are used (using anonymised aggregate data only, not individual tracking).</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your personal data to third parties.
          We do <strong>not</strong> use your data for advertising or marketing by third parties.
        </p>
      </section>

      <section id="basis">
        <h2>5. Legal Basis for Processing (UK GDPR)</h2>
        <p>We process your data on the following legal bases:</p>
        <ul>
          <li><strong>Contract performance</strong> — processing necessary to provide the Deck Days service you signed up for (account management, storing journal data).</li>
          <li><strong>Legitimate interests</strong> — security, fraud prevention, service improvement, and maintaining the integrity of the platform.</li>
          <li><strong>Legal obligation</strong> — compliance with applicable law where required.</li>
          <li><strong>Consent</strong> — where we ask for your explicit consent (e.g. email notifications, if introduced).</li>
        </ul>
      </section>

      <section id="retention">
        <h2>6. Data Retention</h2>
        <p>
          We retain your personal data for as long as your account is active. When you delete your
          account, we will delete your personal data within <strong>90 days</strong>, except where we
          are required by law to retain it longer (e.g. fraud investigations, legal proceedings).
        </p>
        <p>
          Anonymised, aggregated data (which cannot identify you) may be retained indefinitely for
          statistical purposes.
        </p>
        <p>
          Automated database backups may retain your data for up to <strong>30 additional days</strong>
          after deletion before being overwritten.
        </p>
      </section>

      <section id="sharing">
        <h2>7. Sharing Your Data</h2>
        <p>We share your data with the following third-party data processors:</p>
        <ul>
          <li>
            <strong>Supabase Inc.</strong> — our database, authentication, and file storage provider.
            Data is hosted in EU or US regions. Supabase is bound by a data processing agreement.
            See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase's Privacy Policy</a>.
          </li>
          <li>
            <strong>Vercel Inc.</strong> — our hosting and CDN provider. Your IP address and request
            metadata are processed by Vercel. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel's Privacy Policy</a>.
          </li>
        </ul>
        <p>
          We may also disclose data if required to do so by law, a court order, or to protect the safety
          of users or the public.
        </p>
        <p>
          We do not share your private journal content with other users without your explicit action
          (e.g. sharing a post).
        </p>
      </section>

      <section id="rights">
        <h2>8. Your Rights</h2>
        <p>Under the UK GDPR, you have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Right of access</strong> — you can request a copy of the personal data we hold about you.</li>
          <li><strong>Right to rectification</strong> — you can ask us to correct inaccurate data.</li>
          <li><strong>Right to erasure</strong> — you can ask us to delete your data (subject to legal obligations).</li>
          <li><strong>Right to restriction</strong> — you can ask us to limit how we use your data in certain circumstances.</li>
          <li><strong>Right to portability</strong> — you can request your data in a structured, commonly used, machine-readable format.</li>
          <li><strong>Right to object</strong> — you can object to processing based on legitimate interests.</li>
          <li><strong>Right to withdraw consent</strong> — where processing is based on consent, you may withdraw it at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>.
          We will respond within <strong>30 days</strong>.
        </p>
        <p>
          You also have the right to delete your own account and data directly from the app at any time.
          See <a href="/delete-account">Delete Account</a>.
        </p>
      </section>

      <section id="cookies">
        <h2>9. Cookies</h2>
        <p>
          Deck Days uses essential cookies and browser local storage to maintain your session and
          preferences. We do not currently use advertising or tracking cookies.
        </p>
        <p>
          For full details, see our <a href="/legal/cookies">Cookie Policy</a>.
        </p>
      </section>

      <section id="security">
        <h2>10. Security</h2>
        <p>
          We take reasonable technical and organisational measures to protect your data, including
          encrypted data transmission (HTTPS), secure authentication via Supabase Auth,
          and row-level security policies on our database.
        </p>
        <p>
          No internet transmission is 100% secure. While we strive to protect your data, we cannot
          guarantee absolute security. If you discover a security vulnerability, please report it
          responsibly to <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>.
        </p>
      </section>

      <section id="children">
        <h2>11. Children's Privacy</h2>
        <p>
          Deck Days is not directed at children under 13. We do not knowingly collect personal data
          from children under 13. If you believe a child under 13 has created an account, please
          contact us immediately and we will delete the account.
        </p>
        <p>
          Users aged 13–17 should use Deck Days with the knowledge and permission of a parent or guardian.
          See our <a href="/family-safety">Family Safety</a> page.
        </p>
      </section>

      <section id="changes">
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes
          by email or in-app notice. The "Last updated" date at the top indicates when the policy was
          last revised.
        </p>
      </section>

      <section id="contact">
        <h2>13. Contact &amp; Complaints</h2>
        <p>
          For privacy-related enquiries:<br />
          <strong>Email:</strong> <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>
        </p>
        <p>
          If you are not satisfied with our response, you have the right to lodge a complaint with the
          <strong> Information Commissioner's Office (ICO)</strong> at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a> or by calling 0303 123 1113.
        </p>
      </section>

    </LegalPage>
  )
}
