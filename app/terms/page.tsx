import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'DatingDex Terms of Service — rules and guidelines for using our platform.',
  alternates: { canonical: 'https://www.datingdex.com/terms' },
};

export default function TermsPage() {
  return (
    <div className="container legal">
      <h1>Terms of Service</h1>
      <p className="legal-updated">Last updated: April 11, 2026</p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using DatingDex (&ldquo;the Service&rdquo;), operated by DatingDex LLC
          (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by
          these Terms of Service. If you do not agree, please do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          DatingDex provides curated date venue recommendations, AI-powered date planning,
          and related features for the Washington DC metropolitan area. The Service includes
          both free and paid subscription tiers.
        </p>
      </section>

      <section>
        <h2>3. Accounts and Registration</h2>
        <p>
          To access certain features, you must create an account. You are responsible for
          maintaining the confidentiality of your login credentials and for all activity under
          your account. You must be at least 18 years old to use the Service. You agree to
          provide accurate, current, and complete information during registration.
        </p>
      </section>

      <section>
        <h2>4. Subscriptions and Payments</h2>
        <p>
          DatingDex offers paid subscription plans (&ldquo;Pro&rdquo;) that provide access to
          additional features. By subscribing, you authorize us to charge your payment method
          on a recurring basis (monthly or annually, depending on your plan) until you cancel.
        </p>
        <p>
          Prices are listed in US dollars and may change with 30 days&apos; notice. You may
          cancel your subscription at any time through your account settings or by contacting
          us. Cancellation takes effect at the end of the current billing period. We do not
          offer refunds for partial billing periods.
        </p>
      </section>

      <section>
        <h2>5. Free Tier Limitations</h2>
        <p>
          Free accounts are limited to 3 AI-generated date plans per month. Additional features
          such as Date Copilot, personalized recommendations, and Couples Mode require a paid
          subscription. We reserve the right to modify free tier limits at any time.
        </p>
      </section>

      <section>
        <h2>6. User Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Scrape, crawl, or use automated means to access the Service without permission</li>
          <li>Attempt to gain unauthorized access to any part of the Service</li>
          <li>Interfere with or disrupt the Service or its infrastructure</li>
          <li>Impersonate any person or entity</li>
          <li>Submit false or misleading venue reviews or information</li>
        </ul>
      </section>

      <section>
        <h2>7. Venue Information and Recommendations</h2>
        <p>
          DatingDex provides venue information and date recommendations for informational and
          entertainment purposes. We do not guarantee the accuracy, availability, or quality of
          any venue listed. Venues may change hours, menus, prices, or close without notice.
          Always verify details directly with the venue before your date.
        </p>
        <p>
          AI-generated date plans and recommendations are suggestions only. We are not
          responsible for the outcome of any date or experience.
        </p>
      </section>

      <section>
        <h2>8. Restaurant Listings</h2>
        <p>
          Restaurants may claim and manage their listings on DatingDex. Paid restaurant tiers
          (Featured and Premium) receive enhanced placement in recommendations. All restaurant
          listings, whether free or paid, are subject to our editorial standards.
        </p>
      </section>

      <section>
        <h2>9. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are owned by
          DatingDex LLC and are protected by copyright, trademark, and other intellectual
          property laws. You may not reproduce, distribute, or create derivative works from
          our content without written permission.
        </p>
      </section>

      <section>
        <h2>10. Third-Party Services</h2>
        <p>
          The Service may contain links to third-party websites and services (including
          reservation platforms like Resy and OpenTable, and payment processing by Stripe).
          We are not responsible for the content, policies, or practices of third-party
          services.
        </p>
      </section>

      <section>
        <h2>11. Disclaimer of Warranties</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
          warranties of any kind, either express or implied. We do not warrant that the Service
          will be uninterrupted, error-free, or free of harmful components.
        </p>
      </section>

      <section>
        <h2>12. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, DatingDex LLC shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages resulting from your
          use of or inability to use the Service. Our total liability shall not exceed the
          amount you have paid us in the 12 months preceding the claim.
        </p>
      </section>

      <section>
        <h2>13. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. We will notify you of material changes
          by posting the updated Terms on this page and updating the &ldquo;Last updated&rdquo;
          date. Your continued use of the Service after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>14. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the District of Columbia, United States,
          without regard to conflict of law principles.
        </p>
      </section>

      <section>
        <h2>15. Contact</h2>
        <p>
          If you have questions about these Terms, contact us at{' '}
          <a href="mailto:hello@datingdex.com">hello@datingdex.com</a>.
        </p>
      </section>
    </div>
  );
}
