import LegalPage from './legal/LegalPage'

const TOC = [
  { id: 'report-content', label: '1. Reporting Content' },
  { id: 'report-users',   label: '2. Reporting Users' },
  { id: 'block',          label: '3. Blocking & Muting' },
  { id: 'copyright',      label: '4. Copyright Takedowns' },
  { id: 'privacy',        label: '5. Privacy Concerns' },
  { id: 'minors',         label: '6. Child Safety' },
  { id: 'emergency',      label: '7. Emergency Disclaimer' },
  { id: 'contact',        label: '8. Contact' },
]

export default function SafetyPage() {
  return (
    <LegalPage title="Safety & Reporting" badge="Trust & Safety" lastUpdated="June 2026" toc={TOC}>

      <p style={{ marginBottom: 24 }}>
        Deck Days is designed to be a safe, welcoming space for cruisers and their families.
        This page explains how to report problems and protect your experience on the platform.
      </p>

      <section id="report-content">
        <h2>1. Reporting Content</h2>
        <p>If you see a post, photo, or comment that violates our <a href="/legal/community-guidelines">Community Guidelines</a>, you can report it directly in the app:</p>
        <ol>
          <li>Open the post or comment you want to report.</li>
          <li>Tap or click the <strong>⋯</strong> (more options) button.</li>
          <li>Select <strong>Report</strong> and choose the reason that best describes the problem.</li>
          <li>Submit the report — our team will review it.</li>
        </ol>
        <p>
          Alternatively, email us at <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a> with
          details of the content (include a link or screenshot where possible).
        </p>
        <p>
          All reports are reviewed. We do not respond to every report individually but we investigate
          each one and take appropriate action.
        </p>
      </section>

      <section id="report-users">
        <h2>2. Reporting Users</h2>
        <p>If another user is harassing you, impersonating someone, or otherwise behaving harmfully:</p>
        <ol>
          <li>Visit their profile.</li>
          <li>Tap the <strong>⋯</strong> menu and select <strong>Report User</strong>.</li>
          <li>Choose the reason and provide any additional context.</li>
        </ol>
        <p>
          For serious or urgent concerns — particularly threats of violence or child safety —
          email us directly at <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>
          and we will escalate as appropriate.
        </p>
      </section>

      <section id="block">
        <h2>3. Blocking &amp; Muting</h2>
        <h3>Blocking a user</h3>
        <p>
          Blocking a user prevents them from seeing your posts, following you, or sending you
          contact requests. To block someone, visit their profile and select <strong>Block</strong>
          from the options menu.
        </p>

        <h3>Muting a user</h3>
        <p>
          Muting hides a user's posts from your feed without them knowing. They can still see
          your public content. To mute someone, visit their profile or use the mute option on
          their post.
        </p>
        <p>
          You can view and manage your blocked and muted users from your Profile Settings.
        </p>
      </section>

      <section id="copyright">
        <h2>4. Copyright Takedowns</h2>
        <p>
          If you believe content on Deck Days infringes your copyright, send a takedown request to
          <a href="mailto:kiran.x.parmar@gmail.com"> kiran.x.parmar@gmail.com</a> with:
        </p>
        <ul>
          <li>Your name and contact details.</li>
          <li>A description of the copyrighted work you believe has been infringed.</li>
          <li>A link to, or description of, the infringing content on Deck Days.</li>
          <li>A statement that you have a good-faith belief the use is not authorised.</li>
          <li>A statement that the information in your notice is accurate and that you are the rights holder or authorised to act on their behalf.</li>
        </ul>
        <p>
          We will review your request and respond within 5 business days. Valid requests will result
          in the content being removed.
        </p>
        <p>
          If you believe content was incorrectly removed, you may submit a counter-notice to the
          same email address with the relevant details.
        </p>
      </section>

      <section id="privacy">
        <h2>5. Privacy Concerns</h2>
        <p>
          If someone has shared your personal information, photos, or other private content on
          Deck Days without your consent, please report it using the in-app report tool or email us at
          <a href="mailto:kiran.x.parmar@gmail.com"> kiran.x.parmar@gmail.com</a>.
        </p>
        <p>
          For requests to exercise your data rights under the UK GDPR (access, deletion, portability),
          see our <a href="/legal/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section id="minors">
        <h2>6. Child Safety</h2>
        <p>
          Child safety is our highest priority. Any content that sexualises or endangers minors
          is illegal and will result in immediate account termination and reporting to the relevant
          authorities, including the National Crime Agency (NCA) and the Internet Watch Foundation (IWF).
        </p>
        <p>
          If you encounter any such content on Deck Days, report it immediately:
        </p>
        <ul>
          <li>In-app: use the Report button.</li>
          <li>Email: <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a></li>
          <li>IWF Report Line: <a href="https://www.iwf.org.uk/report" target="_blank" rel="noopener noreferrer">iwf.org.uk/report</a></li>
          <li>CEOP (UK): <a href="https://www.ceop.police.uk/Safety-Centre/" target="_blank" rel="noopener noreferrer">ceop.police.uk</a></li>
        </ul>
      </section>

      <section id="emergency">
        <h2>7. Emergency Disclaimer</h2>
        <div className="legal-note">
          <strong>Deck Days is not an emergency service.</strong> If you or someone else is in
          immediate danger, call <strong>999</strong> (UK) or your local emergency number.
          We do not monitor the platform in real-time for emergencies.
        </div>
        <p>
          Deck Days is a personal journalling app. Please do not use it to seek emergency
          assistance or to report medical, safety, or criminal emergencies.
        </p>
      </section>

      <section id="contact">
        <h2>8. Contact the Safety Team</h2>
        <p>For all safety, trust, and reporting matters:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a></li>
          <li><strong>Response time:</strong> We aim to respond within 2 business days for standard reports, and immediately for urgent child safety concerns.</li>
        </ul>
      </section>

    </LegalPage>
  )
}
