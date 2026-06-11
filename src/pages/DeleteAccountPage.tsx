import LegalPage from './legal/LegalPage'

const TOC = [
  { id: 'before',    label: '1. Before You Delete' },
  { id: 'how',       label: '2. How to Delete' },
  { id: 'what',      label: '3. What Gets Deleted' },
  { id: 'retention', label: '4. Data After Deletion' },
  { id: 'export',    label: '5. Export Your Data' },
  { id: 'contact',   label: '6. Contact' },
]

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete Account" badge="Account" lastUpdated="June 2026" toc={TOC}>

      <section id="before">
        <h2>1. Before You Delete</h2>
        <p>
          Account deletion is <strong>permanent and irreversible</strong>. Once you delete your
          account, we cannot recover your data.
        </p>
        <p>Please consider these alternatives first:</p>
        <ul>
          <li>
            <strong>Taking a break</strong> — you can simply stop using Deck Days. Your data will
            remain safely stored until you return.
          </li>
          <li>
            <strong>Deleting individual voyages</strong> — you can delete specific voyages or posts
            from within the app without closing your account.
          </li>
          <li>
            <strong>Adjusting privacy settings</strong> — you can make all your content private
            so nothing is visible to other users.
          </li>
        </ul>
        <p>
          If you would like to export your data before deletion, see the
          <a href="#export"> Export Your Data</a> section below.
        </p>
      </section>

      <section id="how">
        <h2>2. How to Delete Your Account</h2>
        <h3>Option A — In-app (recommended)</h3>
        <ol>
          <li>Sign in to Deck Days.</li>
          <li>Go to <strong>Profile</strong> → <strong>Settings</strong>.</li>
          <li>Scroll to the bottom and tap <strong>Delete Account</strong>.</li>
          <li>Confirm your email address and tap <strong>Confirm Delete</strong>.</li>
        </ol>
        <p>Your account will be deactivated immediately and deletion will complete within 90 days.</p>

        <h3>Option B — By email</h3>
        <p>
          If you cannot access your account (e.g. you've forgotten your password), email us at
          <a href="mailto:kiran.x.parmar@gmail.com"> kiran.x.parmar@gmail.com</a> with:
        </p>
        <ul>
          <li>The email address associated with your account.</li>
          <li>Subject line: <strong>Account Deletion Request</strong>.</li>
        </ul>
        <p>We will process your request within 5 business days.</p>
      </section>

      <section id="what">
        <h2>3. What Gets Deleted</h2>
        <p>
          When you delete your account, the following will be permanently deleted:
        </p>
        <ul>
          <li>Your account profile, name, and email address.</li>
          <li>All voyage journals, daily logs, itinerary entries, and notes.</li>
          <li>All food logs, budget records, packing lists, and other journal data.</li>
          <li>All photos and media you uploaded.</li>
          <li>All posts and comments you created.</li>
          <li>Your contact list and social connections.</li>
          <li>Your reactions, reports, and other activity data.</li>
        </ul>
        <p>
          Posts you previously shared with contacts may linger in their feeds for a short period
          while deletion propagates through the system.
        </p>
      </section>

      <section id="retention">
        <h2>4. Data After Deletion</h2>
        <p>
          After you request deletion, your personal data will be removed within <strong>90 days</strong>.
          During this window:
        </p>
        <ul>
          <li>Your account is deactivated and no longer accessible.</li>
          <li>Your data is flagged for deletion in our systems.</li>
          <li>Database backups may retain your data for up to <strong>30 additional days</strong> before being overwritten.</li>
        </ul>
        <p>
          We may retain anonymised, aggregate data that cannot identify you (for example, total
          voyage count statistics) after deletion.
        </p>
        <p>
          In exceptional circumstances, we may retain data longer if required by law or for the
          prevention or investigation of fraud or illegal activity.
        </p>
      </section>

      <section id="export">
        <h2>5. Export Your Data</h2>
        <p>
          You have the right to a copy of your personal data under the UK GDPR. To request a
          data export before or independently of account deletion:
        </p>
        <ol>
          <li>Email <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a> with subject: <strong>Data Export Request</strong>.</li>
          <li>Include the email address on your Deck Days account.</li>
          <li>We will send you a copy of your data within <strong>30 days</strong>.</li>
        </ol>
        <p>
          We aim to provide data in a portable, machine-readable format (JSON). We are also working
          on a self-serve export feature within the app.
        </p>
      </section>

      <section id="contact">
        <h2>6. Contact</h2>
        <p>
          Questions about account deletion? We're here to help:<br />
          <strong>Email:</strong> <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a><br />
          <strong>Response time:</strong> Within 5 business days.
        </p>
      </section>

    </LegalPage>
  )
}
