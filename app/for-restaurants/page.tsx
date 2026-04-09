import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Restaurants — Reach Date-Night Diners | DatingDex',
  description:
    'DatingDex is where DC goes to plan dates. Claim your listing free, get boosted in our Plan My Date AI results, and reach diners who are actively looking for the perfect spot.',
  alternates: { canonical: 'https://www.datingdex.com/for-restaurants' },
  openGraph: {
    title: 'List your restaurant on DatingDex — reach date-night diners',
    description: 'Get in front of DC daters who are actively planning a night out. Claim free or boost your placement.',
    type: 'website',
  },
};

export default function ForRestaurantsLanding() {
  return (
    <div className="for-restaurants">
      <section className="fr-hero">
        <div className="container">
          <div className="fr-eyebrow">For Restaurants</div>
          <h1>Reach diners while they&apos;re planning the night.</h1>
          <p className="fr-lede">
            DatingDex is where Washington DC plans dates. Every month, thousands of high-intent diners use Plan My Date to build a complete date night — and they want to know which spot to pick. Be the one they pick.
          </p>
          <div className="fr-cta-row">
            <Link href="/for-restaurants/pricing" className="cta">See pricing</Link>
            <Link href="/restaurants/dashboard" className="cta cta-secondary">Claim your listing free</Link>
          </div>
          <p className="pmd-fineprint">No credit card required · 14-day free trial on paid tiers</p>
        </div>
      </section>

      <section className="fr-stats">
        <div className="container">
          <div className="fr-stat">
            <div className="fr-stat-num">309</div>
            <div className="fr-stat-label">Hand-curated DC venues</div>
          </div>
          <div className="fr-stat">
            <div className="fr-stat-num">High-intent</div>
            <div className="fr-stat-label">Diners actively planning a night out</div>
          </div>
          <div className="fr-stat">
            <div className="fr-stat-num">AI-powered</div>
            <div className="fr-stat-label">Plan My Date sends booking-ready traffic</div>
          </div>
        </div>
      </section>

      <section className="fr-how">
        <div className="container">
          <h2>How DatingDex sends you bookings</h2>
          <div className="pmd-steps">
            <div className="pmd-step">
              <div className="pmd-step-num">1</div>
              <h3>A diner describes their date</h3>
              <p>&ldquo;Anniversary, romantic, $150 budget, walking distance from Logan Circle.&rdquo;</p>
            </div>
            <div className="pmd-step">
              <div className="pmd-step-num">2</div>
              <h3>Our AI builds a full night</h3>
              <p>Plan My Date selects 1–3 venues for the diner&apos;s vibe and clusters them so they can walk between stops. <strong>Featured and Premium restaurants are surfaced first.</strong></p>
            </div>
            <div className="pmd-step">
              <div className="pmd-step-num">3</div>
              <h3>One-tap booking</h3>
              <p>Each pick has a Resy or OpenTable deep-link. The diner is in your reservation flow in one tap, with date and party size pre-filled.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="fr-features">
        <div className="container">
          <h2>What you get</h2>
          <div className="pmd-feature-grid">
            <div className="pmd-feature">
              <div className="pmd-feature-icon">✅</div>
              <h3>Verified, claimed listing</h3>
              <p>Edit photos, hours, description, and date packages. Keep it accurate. Respond to reviews directly.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">📈</div>
              <h3>Boosted Plan My Date placement</h3>
              <p>The killer feature. Featured and Premium tiers get a real algorithmic boost in Plan My Date results — the place where booking-ready diners actually decide.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">📊</div>
              <h3>Analytics dashboard</h3>
              <p>Views, clicks, saves, booking-link clicks — broken down by source so you know what&apos;s working.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">🎁</div>
              <h3>Date packages</h3>
              <p>Offer special deals to DatingDex diners — a complimentary glass of bubbles, a fixed-price tasting, a chef&apos;s welcome bite. Promoted on your listing and in Plan My Date results.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">🏷</div>
              <h3>Featured badges</h3>
              <p>&ldquo;Featured&rdquo; or &ldquo;Perfect Date Spot&rdquo; badges appear on your listing and in search results. Trust signal that converts.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">🤝</div>
              <h3>Dedicated account manager</h3>
              <p>Premium tier includes a real human you can email. Photos, copy, package strategy — we&apos;ll help you optimize.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pmd-final">
        <div className="container">
          <h2>Get listed in 2 minutes.</h2>
          <p>Free forever to claim. Upgrade only when the bookings come in.</p>
          <Link href="/for-restaurants/pricing" className="cta">See pricing →</Link>
        </div>
      </section>
    </div>
  );
}
