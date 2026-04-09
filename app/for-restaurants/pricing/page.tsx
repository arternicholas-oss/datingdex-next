'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { track } from '@/components/PostHogProvider';

export default function ForRestaurantsPricing() {
  const { user, openAuth } = useAuth();

  async function startCheckout(plan: 'restaurant_featured' | 'restaurant_premium') {
    track('restaurant_checkout_clicked', { plan });
    if (!user) {
      openAuth('signup');
      return;
    }
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    alert(data.message || 'Stripe is launching soon — your spot is held.');
  }

  return (
    <div className="container premium for-restaurants-pricing">
      <div className="premium-hero">
        <div className="fr-eyebrow">For Restaurants</div>
        <h1>Get in front of date-night diners.</h1>
        <p>DatingDex is where DC plans dates. Start free and upgrade when the bookings come in.</p>
      </div>

      <div className="premium-grid">
        <div className="premium-card">
          <h2>Basic</h2>
          <div className="premium-price">Free</div>
          <div className="premium-period">Claim &amp; verify your listing</div>
          <ul>
            <li>Claimed &amp; verified listing</li>
            <li>Edit photos &amp; description</li>
            <li>Respond to reviews</li>
            <li>Basic visibility in search</li>
            <li className="muted">🔒 Boosted Plan My Date placement</li>
            <li className="muted">🔒 Analytics dashboard</li>
            <li className="muted">🔒 Date package promotion</li>
          </ul>
          <Link href="/restaurants/dashboard" className="cta cta-secondary">Get started free</Link>
        </div>

        <div className="premium-card featured">
          <div className="premium-badge">MOST POPULAR</div>
          <h2>Featured</h2>
          <div className="premium-price">$99<span>/month</span></div>
          <div className="premium-period">14-day free trial. No CC required.</div>
          <ul>
            <li>Everything in Basic</li>
            <li><strong>Boosted placement</strong> in Plan My Date results</li>
            <li>&ldquo;Featured&rdquo; badge on your listing</li>
            <li>Analytics: views, clicks, saves, booking-link clicks</li>
            <li>Date package promotion</li>
            <li>Search result priority</li>
          </ul>
          <button className="cta" onClick={() => startCheckout('restaurant_featured')}>Start 14-day trial</button>
        </div>

        <div className="premium-card">
          <h2>Premium</h2>
          <div className="premium-price">$249<span>/month</span></div>
          <div className="premium-period">Maximum visibility + insights</div>
          <ul>
            <li>Everything in Featured</li>
            <li><strong>Top placement</strong> in all results</li>
            <li>&ldquo;Perfect Date Spot&rdquo; badge</li>
            <li><strong>Priority in Plan My Date</strong> — strongest algorithmic boost</li>
            <li>Full analytics + competitor insights</li>
            <li>Dedicated account manager</li>
          </ul>
          <button className="cta cta-secondary" onClick={() => startCheckout('restaurant_premium')}>Contact sales</button>
        </div>
      </div>

      <div className="premium-restaurant-cta">
        <p>Questions? Email <a href="mailto:restaurants@datingdex.com">restaurants@datingdex.com</a></p>
      </div>
    </div>
  );
}
