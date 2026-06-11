import LegalPage from './legal/LegalPage'

const TOC = [
  { id: 'age',       label: '1. Minimum Age' },
  { id: 'family',    label: '2. Family Use' },
  { id: 'photos',    label: '3. Photos of Children' },
  { id: 'defaults',  label: '4. Privacy Defaults' },
  { id: 'reporting', label: '5. Reporting Concerns' },
  { id: 'parents',   label: '6. Guidance for Parents' },
]

export default function FamilyPage() {
  return (
    <LegalPage title="Family Safety" badge="Trust & Safety" lastUpdated="June 2026" toc={TOC}>

      <p style={{ marginBottom: 24 }}>
        Cruise travel is a family experience. Deck Days is designed to help you document those
        memories safely. This page explains how we protect younger users and provides guidance
        for families using the platform.
      </p>

      <section id="age">
        <h2>1. Minimum Age</h2>
        <p>
          Deck Days requires users to be at least <strong>13 years old</strong> to create an account.
          Users aged 13–17 must have the knowledge and permission of a parent or guardian.
        </p>
        <p>
          We do not knowingly allow children under 13 to register. If you believe an account belongs
          to a child under 13, please contact us at
          <a href="mailto:kiran.x.parmar@gmail.com"> kiran.x.parmar@gmail.com</a> and we will
          investigate and close the account.
        </p>
        <p>
          <strong>We strongly recommend that Deck Days not be used as a social platform for children.</strong>
          While the journal features are suitable for all ages (with parental oversight), the social
          feed and contact features are designed for adults.
        </p>
      </section>

      <section id="family">
        <h2>2. Family Use</h2>
        <p>
          Deck Days is primarily designed for adult cruisers who want to document their voyages.
          If your family uses Deck Days together:
        </p>
        <ul>
          <li>We recommend parents manage the account on behalf of younger children.</li>
          <li>Teens aged 13–17 should use the app under parental supervision.</li>
          <li>Social features (sharing posts, adding contacts) should be used cautiously by younger users.</li>
          <li>Private journal mode (the default) is appropriate for all ages.</li>
        </ul>
      </section>

      <section id="photos">
        <h2>3. Photos of Children</h2>
        <p>
          Cruise photos often include children. We take photos of minors seriously. When uploading
          photos that include children:
        </p>
        <ul>
          <li>
            <strong>Keep them private.</strong> Photos of children should only ever be shared with
            <em> Private</em> or <em>Family</em> audiences — never with a Public audience.
          </li>
          <li>
            <strong>Get consent.</strong> If a photo includes other people's children (fellow passengers,
            etc.), obtain parental consent before uploading.
          </li>
          <li>
            <strong>Don't include identifying details.</strong> Avoid sharing photos that reveal a
            child's school, home address, or other identifying personal information in captions or notes.
          </li>
          <li>
            <strong>Be thoughtful.</strong> Consider whether children in your photos would be comfortable
            with the image being stored and shared when they are older.
          </li>
        </ul>
        <p>
          Any content that sexualises minors is illegal and will result in immediate account
          termination and referral to law enforcement. See <a href="/safety">Safety &amp; Reporting</a>.
        </p>
      </section>

      <section id="defaults">
        <h2>4. Privacy Defaults</h2>
        <p>
          By default, all Deck Days content is <strong>private</strong> — visible only to you.
          Content only becomes visible to others when you explicitly choose to share it:
        </p>
        <ul>
          <li><strong>Private</strong> (default) — only you can see it.</li>
          <li><strong>Family</strong> — visible to contacts you have approved as family.</li>
          <li><strong>Public</strong> — visible to all your approved contacts.</li>
        </ul>
        <p>
          There is no option to make content visible to anonymous internet users. All sharing on
          Deck Days is contact-to-contact only.
        </p>
      </section>

      <section id="reporting">
        <h2>5. Reporting Concerns</h2>
        <p>
          If you have a concern about a child's safety on Deck Days — including content that
          involves or endangers a child — please report it immediately:
        </p>
        <ul>
          <li><strong>In-app:</strong> use the Report button on any post or profile.</li>
          <li><strong>Email:</strong> <a href="mailto:kiran.x.parmar@gmail.com">kiran.x.parmar@gmail.com</a> — subject: <em>Child Safety Concern</em></li>
          <li><strong>CEOP (UK Police):</strong> <a href="https://www.ceop.police.uk" target="_blank" rel="noopener noreferrer">ceop.police.uk</a></li>
          <li><strong>Internet Watch Foundation:</strong> <a href="https://www.iwf.org.uk/report" target="_blank" rel="noopener noreferrer">iwf.org.uk/report</a></li>
        </ul>
        <p>
          We treat all child safety reports as urgent and will escalate to relevant authorities
          as required by law.
        </p>
      </section>

      <section id="parents">
        <h2>6. Guidance for Parents &amp; Guardians</h2>
        <p>
          If your teenager (aged 13–17) uses Deck Days, we recommend:
        </p>
        <ul>
          <li>Reviewing the <a href="/legal/community-guidelines">Community Guidelines</a> with them.</li>
          <li>Keeping all content set to <strong>Private</strong> or <strong>Family</strong> audience.</li>
          <li>Supervising their contact list and reviewing who they are connected to.</li>
          <li>Not sharing photos of themselves publicly.</li>
          <li>Discussing what to do if they see inappropriate content or feel uncomfortable.</li>
        </ul>
        <p>
          Questions or concerns about your child's account? Email us at
          <a href="mailto:kiran.x.parmar@gmail.com"> kiran.x.parmar@gmail.com</a>.
        </p>
      </section>

    </LegalPage>
  )
}
