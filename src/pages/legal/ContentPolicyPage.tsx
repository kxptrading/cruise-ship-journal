import LegalPage from './LegalPage'

const TOC = [
  { id: 'ownership', label: '1. Your Content' },
  { id: 'licence',   label: '2. Licence You Grant Us' },
  { id: 'standards', label: '3. Content Standards' },
  { id: 'copyright', label: '4. Copyright' },
  { id: 'removal',   label: '5. Removal & Moderation' },
  { id: 'deletion',  label: '6. Account Deletion' },
  { id: 'contact',   label: '7. Contact' },
]

export default function ContentPolicyPage() {
  return (
    <LegalPage title="Content Policy" lastUpdated="June 2026" toc={TOC}>

      <section id="ownership">
        <h2>1. Your Content</h2>
        <p>
          <strong>You own your content.</strong> Everything you create in Deck Days — your journal
          entries, voyage notes, photos, posts, food logs, packing lists, and any other material —
          remains yours.
        </p>
        <p>
          Deck Days is a tool for storing and organising your memories. We do not claim ownership
          over your content, and we do not use your personal journal content for any purpose other
          than providing the service to you.
        </p>
      </section>

      <section id="licence">
        <h2>2. Licence You Grant Us</h2>
        <p>
          By uploading content to Deck Days, you grant KXP Technologies a limited, non-exclusive,
          worldwide, royalty-free licence to:
        </p>
        <ul>
          <li><strong>Store</strong> your content on our infrastructure (Supabase).</li>
          <li><strong>Display</strong> your content back to you and, where you have chosen to share it, to your designated contacts.</li>
          <li><strong>Process and resize</strong> images for efficient delivery on different device sizes.</li>
          <li><strong>Back up</strong> your content as part of routine data protection.</li>
        </ul>
        <p>
          This licence exists <em>solely</em> to operate the service. We do not use your content
          for advertising, machine learning training, or any other secondary purpose.
        </p>
        <p>
          This licence terminates when you delete the relevant content or close your account,
          subject to the data retention period described in our <a href="/legal/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section id="standards">
        <h2>3. Content Standards</h2>
        <p>
          All content you submit must comply with our <a href="/legal/community-guidelines">Community Guidelines</a>
          and <a href="/legal/terms">Terms of Service</a>. In summary, content must not:
        </p>
        <ul>
          <li>Be illegal, defamatory, or harmful to others.</li>
          <li>Contain sexual content or nudity.</li>
          <li>Depict graphic violence or gore.</li>
          <li>Harass, threaten, or intimidate other users.</li>
          <li>Contain malware or malicious code.</li>
          <li>Infringe copyright, trademarks, or other intellectual property rights.</li>
          <li>Violate the privacy of others without their consent.</li>
        </ul>

        <h3>Photo standards</h3>
        <p>When uploading photos, you confirm that:</p>
        <ul>
          <li>You took the photo, or you have explicit permission from the copyright holder to upload it.</li>
          <li>Identifiable people in the photo have given their consent, or you have lawful authority to share the image.</li>
          <li>Photos of children are only shared with private or family audiences.</li>
          <li>The photo does not contain nudity, violence, or otherwise prohibited content.</li>
        </ul>
      </section>

      <section id="copyright">
        <h2>4. Copyright</h2>
        <p>
          You must only upload content that you own or have the right to use. Uploading someone else's
          copyrighted photos, text, or artwork without permission is a breach of these guidelines and
          may violate UK copyright law.
        </p>
        <p>
          If you believe content on Deck Days infringes your copyright, please see our
          <a href="/safety"> Safety &amp; Reporting</a> page for how to submit a copyright takedown request.
        </p>
        <p>
          We respond to valid copyright complaints and will remove infringing content promptly.
          Repeat infringement will result in account termination.
        </p>
      </section>

      <section id="removal">
        <h2>5. Removal &amp; Moderation</h2>
        <p>
          We reserve the right to remove content that violates this policy or our Community Guidelines,
          with or without notice.
        </p>
        <p>
          Content may be removed because it was:
        </p>
        <ul>
          <li>Reported by another user and found to violate our policies.</li>
          <li>Identified by us during routine moderation.</li>
          <li>Subject to a valid legal takedown request.</li>
        </ul>
        <p>
          Where content is removed, we will generally notify the account holder unless doing so would
          compromise a safety investigation or legal obligation.
        </p>
      </section>

      <section id="deletion">
        <h2>6. Account Deletion</h2>
        <p>
          When you delete your account, your content is removed from our systems in accordance
          with our <a href="/legal/privacy">Privacy Policy</a>.
        </p>
        <p>
          Content you have previously shared publicly or with contacts may be retained in those
          contacts' feeds for a limited period while system deletion processes complete.
          Backup copies may persist for up to 30 days after deletion.
        </p>
        <p>
          If you shared posts publicly, we cannot guarantee that recipients did not save copies
          before you deleted them.
        </p>
        <p>See <a href="/delete-account">Delete Account</a> for step-by-step instructions.</p>
      </section>

      <section id="contact">
        <h2>7. Contact</h2>
        <p>
          Questions about this Content Policy? Contact us at:<br />
          <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>
        </p>
      </section>

    </LegalPage>
  )
}
