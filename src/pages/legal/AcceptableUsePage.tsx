import LegalPage from './LegalPage'

const TOC = [
  { id: 'intro',     label: '1. Introduction' },
  { id: 'permitted', label: '2. Permitted Use' },
  { id: 'prohibited',label: '3. Prohibited Activities' },
  { id: 'technical', label: '4. Technical Restrictions' },
  { id: 'enforce',   label: '5. Enforcement' },
  { id: 'contact',   label: '6. Contact' },
]

export default function AcceptableUsePage() {
  return (
    <LegalPage title="Acceptable Use Policy" lastUpdated="June 2026" toc={TOC}>

      <section id="intro">
        <h2>1. Introduction</h2>
        <p>
          This Acceptable Use Policy ("<strong>AUP</strong>") sets out the rules governing how you may
          access and use Deck Days. It applies to all users, including visitors and registered users,
          and forms part of our <a href="/legal/terms">Terms of Service</a>.
        </p>
        <p>
          By using Deck Days, you agree to comply with this AUP. If you do not agree, you must stop
          using the service immediately.
        </p>
      </section>

      <section id="permitted">
        <h2>2. Permitted Use</h2>
        <p>You may use Deck Days to:</p>
        <ul>
          <li>Create and maintain personal cruise voyage journals.</li>
          <li>Upload photos and media related to your own voyages.</li>
          <li>Connect with family, friends, and fellow cruisers in good faith.</li>
          <li>Share selected posts with contacts you have explicitly connected with.</li>
          <li>Access and use features made available to your account tier.</li>
        </ul>
      </section>

      <section id="prohibited">
        <h2>3. Prohibited Activities</h2>
        <p>You must not use Deck Days for any of the following:</p>

        <h3>Illegal activity</h3>
        <ul>
          <li>Using the service in any way that violates applicable local, national, or international law.</li>
          <li>Uploading or sharing content that is illegal in the United Kingdom or your jurisdiction.</li>
          <li>Engaging in or facilitating fraud, money laundering, or financial crime.</li>
        </ul>

        <h3>Harmful content</h3>
        <ul>
          <li>Uploading, distributing, or linking to malware, viruses, or harmful code.</li>
          <li>Hosting or distributing content that constitutes spam or unsolicited bulk communications.</li>
          <li>Creating or promoting illegal content including child sexual abuse material (CSAM).</li>
        </ul>

        <h3>Unauthorised access</h3>
        <ul>
          <li>Attempting to gain unauthorised access to any user account, server, or network.</li>
          <li>Circumventing or disabling authentication, security controls, or access restrictions.</li>
          <li>Testing or probing for security vulnerabilities without our express written authorisation.</li>
        </ul>

        <h3>Service abuse</h3>
        <ul>
          <li>Scraping, crawling, or extracting data from Deck Days by automated means without our permission.</li>
          <li>Creating multiple accounts to circumvent bans, suspensions, or usage limits.</li>
          <li>Using the service to send unsolicited messages (spam) to other users.</li>
          <li>Attempting to overload or disrupt the service through denial-of-service attacks or similar.</li>
          <li>Using the service for any commercial purpose — including advertising, selling, or reselling access — without prior written agreement.</li>
          <li>Reverse-engineering, decompiling, or disassembling any part of the Deck Days application.</li>
          <li>Accessing Deck Days via automated means (bots, scripts) in a way that places excessive load on our infrastructure.</li>
        </ul>

        <h3>Identity and impersonation</h3>
        <ul>
          <li>Creating fake accounts or misrepresenting your identity.</li>
          <li>Impersonating Deck Days, KXP Technologies, or any member of our team.</li>
          <li>Misrepresenting your affiliation with any organisation or individual.</li>
        </ul>
      </section>

      <section id="technical">
        <h2>4. Technical Restrictions</h2>
        <p>You must not:</p>
        <ul>
          <li>Modify, adapt, or create derivative works based on any part of Deck Days.</li>
          <li>Embed or frame any part of Deck Days without express written permission.</li>
          <li>Use any robot, spider, or other automated device to access or index the service.</li>
          <li>Interfere with the proper working of any Deck Days feature or infrastructure.</li>
          <li>Introduce any worm, trojan, exploit, or similar disruptive code.</li>
        </ul>
      </section>

      <section id="enforce">
        <h2>5. Enforcement</h2>
        <p>
          We reserve the right to investigate suspected violations of this AUP. In response to a
          violation, we may, at our discretion:
        </p>
        <ul>
          <li>Suspend or terminate your account with or without notice.</li>
          <li>Remove offending content.</li>
          <li>Restrict your access to certain features.</li>
          <li>Report activity to law enforcement authorities where legally required.</li>
          <li>Pursue legal remedies available under English law.</li>
        </ul>
      </section>

      <section id="contact">
        <h2>6. Contact</h2>
        <p>
          To report an AUP violation or for questions about this policy, contact us at:<br />
          <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>
        </p>
      </section>

    </LegalPage>
  )
}
