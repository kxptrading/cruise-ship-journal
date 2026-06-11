import LegalPage from './LegalPage'

const TOC = [
  { id: 'intro',      label: '1. Introduction' },
  { id: 'respect',    label: '2. Be Respectful' },
  { id: 'content',    label: '3. Content Rules' },
  { id: 'privacy',    label: '4. Privacy & Consent' },
  { id: 'children',   label: '5. Children & Families' },
  { id: 'spam',       label: '6. Spam & Manipulation' },
  { id: 'reporting',  label: '7. Reporting Violations' },
  { id: 'enforce',    label: '8. Enforcement' },
]

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage title="Community Guidelines" lastUpdated="June 2026" toc={TOC}>

      <section id="intro">
        <h2>1. Introduction</h2>
        <p>
          Deck Days is a place to record, reflect on, and share your cruise experiences.
          While most of the app is a private journal, it includes social features — shared posts,
          contacts, reactions, and comments — that connect you with fellow cruisers.
        </p>
        <p>
          These Community Guidelines set out the standards we expect from everyone who uses
          Deck Days's social features. They apply in addition to our <a href="/legal/terms">Terms of Service</a>.
          By using Deck Days, you agree to follow these guidelines.
        </p>
        <p>
          The spirit of these guidelines is simple: <strong>be the kind of person you'd want to sail with.</strong>
        </p>
      </section>

      <section id="respect">
        <h2>2. Be Respectful</h2>
        <p>
          Deck Days is a welcoming community for all cruisers — regardless of age, background, nationality,
          disability, gender, religion, or any other characteristic.
        </p>
        <p>We do not tolerate:</p>
        <ul>
          <li>Harassment, bullying, or intimidation of any kind.</li>
          <li>Hate speech or content that discriminates against or dehumanises people based on protected characteristics.</li>
          <li>Threats of violence or content that glorifies violence.</li>
          <li>Repeatedly contacting users who have asked you to stop.</li>
          <li>Coordinated campaigns to abuse, pile on, or isolate another user.</li>
        </ul>
        <p>
          Disagreement is fine. Abuse is not.
        </p>
      </section>

      <section id="content">
        <h2>3. Content Rules</h2>
        <p>When you share posts or photos on Deck Days, they must not include:</p>
        <ul>
          <li><strong>Sexual content</strong> — including nudity, explicit images, or content of a sexual nature. This includes content that sexualises minors in any way.</li>
          <li><strong>Graphic violence</strong> — including images depicting injury, gore, or death.</li>
          <li><strong>Illegal content</strong> — anything that facilitates, promotes, or depicts illegal activity.</li>
          <li><strong>Misinformation</strong> — deliberately false or misleading information that could harm others.</li>
          <li><strong>Private information</strong> — sharing personal details of others without their consent (addresses, financial information, identity documents).</li>
          <li><strong>Copyrighted material</strong> — content you don't have the right to share (see our <a href="/legal/content-policy">Content Policy</a>).</li>
        </ul>
      </section>

      <section id="privacy">
        <h2>4. Privacy &amp; Consent</h2>
        <ul>
          <li>Do not post photos or videos of other people without their knowledge and consent, especially in private settings.</li>
          <li>Do not share another person's private information without their permission (sometimes called "doxing").</li>
          <li>Do not impersonate other users, public figures, or organisations.</li>
          <li>Respect the privacy settings of other users — do not screenshot and re-share private or family-audience content without permission.</li>
        </ul>
      </section>

      <section id="children">
        <h2>5. Children &amp; Families</h2>
        <p>
          Cruise journeys often involve children and families. Deck Days users sometimes share photos
          of their children or other people's children. When doing so:
        </p>
        <ul>
          <li>Only share photos of children to <strong>private or family audiences</strong> (not public).</li>
          <li>Do not share photos of other people's children without the consent of a parent or guardian.</li>
          <li>Never share identifying information about a child (name, school, location) publicly.</li>
          <li>Any content that sexualises minors will be removed immediately and reported to relevant authorities.</li>
        </ul>
        <p>See also our <a href="/family-safety">Family Safety</a> page.</p>
      </section>

      <section id="spam">
        <h2>6. Spam &amp; Manipulation</h2>
        <ul>
          <li>Do not send unsolicited promotional messages to other users.</li>
          <li>Do not create fake or duplicate accounts.</li>
          <li>Do not attempt to artificially inflate reactions or engagement.</li>
          <li>Do not use automated tools to interact with other users without their knowledge.</li>
          <li>Do not use Deck Days for commercial promotion without our prior permission.</li>
        </ul>
      </section>

      <section id="reporting">
        <h2>7. Reporting Violations</h2>
        <p>
          If you see content or behaviour that violates these guidelines, please report it using
          the in-app report function on posts, or by contacting us directly.
        </p>
        <p>
          For detailed instructions on how to report, see our <a href="/safety">Safety &amp; Reporting</a> page.
        </p>
        <p>
          We review all reports. We may not respond to every report individually, but we investigate
          each one and take action where guidelines have been breached.
        </p>
      </section>

      <section id="enforce">
        <h2>8. Enforcement</h2>
        <p>
          Depending on the severity and frequency of violations, we may take the following actions:
        </p>
        <ul>
          <li>Remove the offending content.</li>
          <li>Issue a warning to your account.</li>
          <li>Temporarily restrict your ability to post or interact.</li>
          <li>Suspend your account for a fixed period.</li>
          <li>Permanently ban your account.</li>
          <li>Report your content to law enforcement where required by law.</li>
        </ul>
        <p>
          We reserve the right to act immediately and without warning for serious violations,
          including illegal content, child safety concerns, or credible threats of violence.
        </p>
        <p>
          If you believe action has been taken against your account in error, please contact us at
          <a href="mailto:kiran.x.parmar@gmail.com"> kiran.x.parmar@gmail.com</a>.
        </p>
      </section>

    </LegalPage>
  )
}
