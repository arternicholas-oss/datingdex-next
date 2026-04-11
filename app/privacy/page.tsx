import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'DatingDex Privacy Policy — how we collect, use, and protect your data.',
  alternates: { canonical: 'https://www.datingdex.com/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="container legal">
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: April 11, 2026</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          DatingDex LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects
          your privacy. This Privacy Policy explains how we collect, use, disclose, and
          safeguard your information when you use datingdex.com and related services
          (collectively, &ldquo;the Service&rdquo;).
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>

        <h3>Information you provide</h3>
        <ul>
          <li><strong>Account information:</strong> email address, name, and password when you register</li>
          <li><strong>Date preferences:</strong> vibes, budgets, neighborhoods, and other inputs you provide when generating date plans</li>
          <li><strong>Payment information:</strong> processed securely by Stripe — we never store your full card number</li>
          <li><strong>Communications:</strong> emails or messages you send us</li>
        </ul>

        <h3>Information collected automatically</h3>
        <ul>
          <li><strong>Usage data:</strong> pages visited, features used, date plans generated, and interactions with the Service</li>
          <li><strong>Device information:</strong> browser type, operating system, and screen size</li>
          <li><strong>Analytics:</strong> we use PostHog to understand how people use the Service and improve it</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, operate, and improve the Service</li>
          <li>Generate personalized date recommendations and plans</li>
          <li>Process payments and manage subscriptions</li>
          <li>Send transactional emails (plan confirmations, post-date debriefs, anniversary reminders)</li>
          <li>Analyze usage patterns to improve features</li>
          <li>Prevent fraud and enforce our Terms of Service</li>
          <li>Respond to your inquiries and support requests</li>
        </ul>
      </section>

      <section>
        <h2>4. AI-Generated Content</h2>
        <p>
          DatingDex uses artificial intelligence (powered by Anthropic) to generate date plans,
          choreography suggestions, and recommendations. Your inputs (preferences, free-text
          descriptions) are sent to our AI provider to generate results. We do not use your
          personal data to train AI models. AI-generated content is stored with your plan
          history to improve future recommendations.
        </p>
      </section>

      <section>
        <h2>5. How We Share Your Information</h2>
        <p>We do not sell your personal information. We may share information with:</p>
        <ul>
          <li><strong>Service providers:</strong> Stripe (payments), Supabase (database and authentication), Anthropic (AI), Vercel (hosting), PostHog (analytics), and Resend (email)</li>
          <li><strong>Legal requirements:</strong> when required by law, regulation, or legal process</li>
          <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets</li>
        </ul>
        <p>
          When you share a date plan via a share link, the plan itinerary becomes publicly
          accessible to anyone with the link. No personal information is included in shared plans.
        </p>
      </section>

      <section>
        <h2>6. Cookies and Tracking</h2>
        <p>
          We use essential cookies to maintain your login session and preferences. We use
          PostHog for product analytics, which may use cookies to track usage across sessions.
          You can manage cookie preferences through your browser settings.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          We retain your account information and date plan history for as long as your account
          is active. If you delete your account, we will remove your personal information within
          30 days, except where required by law or for legitimate business purposes (such as
          fraud prevention).
        </p>
      </section>

      <section>
        <h2>8. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your information,
          including encryption in transit (TLS) and at rest. However, no method of electronic
          storage or transmission is 100% secure. We cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>9. Your Rights</h2>
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access, correct, or delete your personal information</li>
          <li>Object to or restrict processing of your data</li>
          <li>Export your data in a portable format</li>
          <li>Withdraw consent where processing is based on consent</li>
          <li>Opt out of marketing communications at any time</li>
        </ul>
        <p>
          To exercise these rights, contact us at{' '}
          <a href="mailto:hello@datingdex.com">hello@datingdex.com</a>.
        </p>
      </section>

      <section>
        <h2>10. Children&apos;s Privacy</h2>
        <p>
          The Service is not intended for anyone under 18 years of age. We do not knowingly
          collect personal information from children. If we learn we have collected information
          from a child under 18, we will delete it promptly.
        </p>
      </section>

      <section>
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by posting the updated policy on this page and updating the &ldquo;Last
          updated&rdquo; date. We encourage you to review this page periodically.
        </p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p>
          If you have questions about this Privacy Policy or our data practices, contact us at{' '}
          <a href="mailto:hello@datingdex.com">hello@datingdex.com</a>.
        </p>
      </section>
    </div>
  );
}
