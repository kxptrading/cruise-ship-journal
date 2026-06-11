import LegalPage from './LegalPage'

const TOC = [
  { id: 'intro',        label: '1. Introduction' },
  { id: 'eligibility',  label: '2. Eligibility' },
  { id: 'account',      label: '3. Account Registration' },
  { id: 'content',      label: '4. User Content' },
  { id: 'prohibited',   label: '5. Prohibited Conduct' },
  { id: 'ip',           label: '6. Intellectual Property' },
  { id: 'privacy',      label: '7. Privacy' },
  { id: 'availability', label: '8. Service Availability' },
  { id: 'termination',  label: '9. Termination' },
  { id: 'disclaimer',   label: '10. Disclaimers' },
  { id: 'liability',    label: '11. Liability' },
  { id: 'governing',    label: '12. Governing Law' },
  { id: 'changes',      label: '13. Changes' },
  { id: 'contact',      label: '14. Contact' },
]

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="June 2026" toc={TOC}>

      <section id="intro">
        <h2>1. Introduction</h2>
        <p>
          Welcome to <strong>Deck Days</strong>, a cruise voyage journal application operated by
          KXP Technologies ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>").
          Deck Days is an independent cruise journal app and is not affiliated with any cruise line unless
          stated otherwise.
        </p>
        <p>
          By creating an account or using Deck Days in any way, you agree to these Terms of Service
          ("<strong>Terms</strong>"). If you do not agree, please do not use the service.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you and KXP Technologies.
          We recommend you read them in full.
        </p>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility</h2>
        <p>You may use Deck Days only if:</p>
        <ul>
          <li>You are at least <strong>13 years old</strong>. If you are under 18, you must have the permission of a parent or guardian.</li>
          <li>You are not prohibited from using the service under the laws of your country of residence.</li>
          <li>You have not previously been suspended or banned from Deck Days.</li>
        </ul>
        <p>
          We do not knowingly collect personal data from children under 13. If we become aware that a user is
          under 13, we will close that account.
        </p>
      </section>

      <section id="account">
        <h2>3. Account Registration</h2>
        <p>To use Deck Days you must register an account. When registering, you agree to:</p>
        <ul>
          <li>Provide accurate, current, and complete information.</li>
          <li>Maintain and promptly update your account information.</li>
          <li>Keep your password secure and not share it with others.</li>
          <li>Notify us immediately at <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a> if you suspect unauthorised access.</li>
          <li>Accept responsibility for all activity that occurs under your account.</li>
        </ul>
        <p>
          You may only hold one account. Accounts are personal and non-transferable.
        </p>
      </section>

      <section id="content">
        <h2>4. User Content</h2>
        <p>
          You retain ownership of all content you upload, create, or submit to Deck Days
          ("<strong>User Content</strong>"), including journal entries, photographs, notes, and voyage data.
        </p>
        <p>
          By submitting User Content, you grant KXP Technologies a non-exclusive, worldwide, royalty-free
          licence to store, process, display, back up, and resize your content solely to provide the Deck Days
          service to you. This licence ends when you delete the content or close your account (subject to our
          data retention policy).
        </p>
        <p>You confirm that:</p>
        <ul>
          <li>You own or have the necessary rights to the content you upload.</li>
          <li>Your content does not infringe any third-party rights, including copyright and privacy rights.</li>
          <li>You have the consent of any identifiable individuals (including for photos) where required.</li>
        </ul>
        <p>
          Content you mark as <strong>private</strong> is stored securely and not shared with other users.
          Content you share publicly or with friends/family is visible to those recipients.
        </p>
      </section>

      <section id="prohibited">
        <h2>5. Prohibited Conduct</h2>
        <p>You agree not to use Deck Days to:</p>
        <ul>
          <li>Post content that is illegal, harmful, threatening, abusive, defamatory, or discriminatory.</li>
          <li>Harass, bully, intimidate, or harm other users.</li>
          <li>Upload content that sexualises minors in any way.</li>
          <li>Impersonate any person or entity, or misrepresent your affiliation.</li>
          <li>Spam other users, post unsolicited promotions, or distribute malware.</li>
          <li>Scrape, harvest, or systematically extract data from Deck Days.</li>
          <li>Attempt to gain unauthorised access to any part of the service or another user's account.</li>
          <li>Use the service for any commercial purpose without our prior written consent.</li>
          <li>Upload content that infringes copyright, trademarks, or other intellectual property rights.</li>
          <li>Violate any applicable law or regulation.</li>
        </ul>
        <p>
          Violations may result in content removal, account suspension, or permanent ban.
          See our <a href="/legal/community-guidelines">Community Guidelines</a> for further detail.
        </p>
      </section>

      <section id="ip">
        <h2>6. Intellectual Property</h2>
        <p>
          The Deck Days application, design, logos, and original content created by KXP Technologies
          are protected by copyright and other intellectual property laws.
          You may not copy, reproduce, modify, or distribute any part of Deck Days without our
          prior written permission.
        </p>
        <p>
          The Deck Days name, logo, and brand are trademarks of KXP Technologies. All other
          trademarks referenced are the property of their respective owners.
        </p>
      </section>

      <section id="privacy">
        <h2>7. Privacy</h2>
        <p>
          Your use of Deck Days is governed by our <a href="/legal/privacy">Privacy Policy</a>,
          which is incorporated into these Terms by reference. By using Deck Days, you consent to
          the collection and use of your information as described in the Privacy Policy.
        </p>
      </section>

      <section id="availability">
        <h2>8. Service Availability</h2>
        <p>
          We aim to keep Deck Days available at all times but we cannot guarantee uninterrupted access.
          We may suspend, withdraw, or restrict access to the service for maintenance, security, or
          operational reasons, with or without notice.
        </p>
        <p>
          We reserve the right to modify or discontinue features at any time. We will give reasonable
          notice of any significant changes where practicable.
        </p>
      </section>

      <section id="termination">
        <h2>9. Termination</h2>
        <p>
          You may close your account at any time via the <a href="/delete-account">Delete Account</a> page
          or by contacting us.
        </p>
        <p>
          We may suspend or terminate your account at any time if we reasonably believe you have
          violated these Terms, without liability to you. We will generally give advance notice unless
          the breach is serious (for example, illegal content or security threats).
        </p>
        <p>
          On termination, your right to use Deck Days ceases immediately. Your User Content will
          be deleted in accordance with our data retention policy.
        </p>
      </section>

      <section id="disclaimer">
        <h2>10. Disclaimers</h2>
        <p>
          Deck Days is provided "<strong>as is</strong>" and "<strong>as available</strong>" without
          warranties of any kind, express or implied, including but not limited to warranties of
          merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p>
          We do not warrant that the service will be error-free, secure, or continuously available.
          Journal entries and uploaded content may be lost in circumstances beyond our reasonable control.
          We strongly encourage you to keep copies of important content.
        </p>
      </section>

      <section id="liability">
        <h2>11. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by applicable law, KXP Technologies shall not be liable
          for any indirect, incidental, special, consequential, or punitive damages arising out of or
          related to your use of Deck Days, including loss of data, loss of profits, or loss of goodwill.
        </p>
        <p>
          Nothing in these Terms excludes or limits our liability for death or personal injury caused by
          negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be
          excluded under English law.
        </p>
        <p>
          Our total liability to you for any claim arising under these Terms shall not exceed
          the greater of (a) the amount you paid us in the 12 months preceding the claim, or
          (b) £50.
        </p>
      </section>

      <section id="governing">
        <h2>12. Governing Law</h2>
        <p>
          These Terms and any dispute or claim arising out of or in connection with them shall be
          governed by and construed in accordance with the laws of England and Wales.
          You and we both agree to submit to the exclusive jurisdiction of the courts of England and Wales,
          except where applicable consumer protection laws in your country of residence give you the right
          to bring a claim in your local courts.
        </p>
      </section>

      <section id="changes">
        <h2>13. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. When we do, we will update the "Last updated"
          date at the top of this page and, for material changes, notify you by email or in-app notice.
        </p>
        <p>
          Your continued use of Deck Days after changes take effect constitutes your acceptance of the
          revised Terms.
        </p>
      </section>

      <section id="contact">
        <h2>14. Contact</h2>
        <p>
          If you have any questions about these Terms, please contact us at:<br />
          <strong>KXP Technologies</strong><br />
          Email: <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>
        </p>
      </section>

    </LegalPage>
  )
}
