import LegalPage from './LegalPage'

const TOC = [
  { id: 'what',      label: '1. What Are Cookies' },
  { id: 'we-use',    label: '2. What We Use' },
  { id: 'essential', label: '3. Essential Cookies' },
  { id: 'storage',   label: '4. Local Storage' },
  { id: 'third',     label: '5. Third-Party Services' },
  { id: 'manage',    label: '6. Managing Preferences' },
  { id: 'contact',   label: '7. Contact' },
]

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="June 2026" toc={TOC}>

      <section id="what">
        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files placed on your device by a website. They help the site remember
          your preferences and session state so you don't have to log in every time.
        </p>
        <p>
          Deck Days uses a minimal set of cookies and browser storage — just what is needed to provide
          a functional, personalised experience. We do <strong>not</strong> use advertising cookies or
          third-party tracking pixels.
        </p>
      </section>

      <section id="we-use">
        <h2>2. What We Use</h2>
        <p>
          Deck Days uses the following types of storage:
        </p>
        <ul>
          <li><strong>Essential cookies</strong> — required for authentication and security.</li>
          <li><strong>Browser local storage</strong> — used to save your preferences (theme, icon pack) and cached voyage ID between sessions.</li>
          <li><strong>Browser session storage</strong> — used for temporary state during your current session.</li>
        </ul>
        <p>
          We do <strong>not</strong> currently use analytics cookies, marketing cookies, or any
          third-party tracking services.
        </p>
      </section>

      <section id="essential">
        <h2>3. Essential Cookies</h2>
        <p>
          Essential cookies are required for the service to function. You cannot opt out of these.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #E0DBD0', fontWeight: 700 }}>Name</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #E0DBD0', fontWeight: 700 }}>Provider</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #E0DBD0', fontWeight: 700 }}>Purpose</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #E0DBD0', fontWeight: 700 }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0', fontFamily: 'monospace', fontSize: 12 }}>sb-*-auth-token</td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0' }}>Supabase</td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0' }}>Maintains your authenticated session</td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0' }}>Session / 1 week</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0', fontFamily: 'monospace', fontSize: 12 }}>sb-*-auth-refresh</td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0' }}>Supabase</td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0' }}>Refreshes your authentication token</td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0' }}>Up to 60 days</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="storage">
        <h2>4. Local Storage</h2>
        <p>
          Deck Days stores the following values in your browser's local storage. These are not
          transmitted to our servers and remain on your device.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #E0DBD0', fontWeight: 700 }}>Key</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #E0DBD0', fontWeight: 700 }}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['csj-theme', 'Your chosen colour theme'],
              ['csj-icon-pack', 'Your chosen icon style'],
              ['csj-activeVoyageId', 'Which voyage is currently open'],
            ].map(([key, purpose]) => (
              <tr key={key}>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0', fontFamily: 'monospace', fontSize: 12 }}>{key}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #E0DBD0' }}>{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="third">
        <h2>5. Third-Party Services</h2>
        <p>
          Deck Days is hosted on <strong>Vercel</strong> and uses <strong>Supabase</strong> for
          authentication and data storage. These providers may set their own technical cookies as
          part of infrastructure operations. We have no control over these.
        </p>
        <p>
          See:
        </p>
        <ul>
          <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a></li>
          <li><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a></li>
        </ul>
      </section>

      <section id="manage">
        <h2>6. Managing Your Preferences</h2>
        <p>
          You can clear all cookies and local storage at any time through your browser settings.
          Note that clearing the Supabase auth cookies will sign you out of Deck Days.
        </p>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and security → Clear browsing data</li>
          <li><strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data → Clear Data</li>
          <li><strong>Safari:</strong> Settings → Safari → Clear History and Website Data</li>
        </ul>
        <p>
          You can also use your browser's developer tools to inspect and remove individual entries
          from cookies and local storage.
        </p>
      </section>

      <section id="contact">
        <h2>7. Contact</h2>
        <p>
          Questions about our use of cookies or storage?
          Contact us at <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a>.
        </p>
      </section>

    </LegalPage>
  )
}
