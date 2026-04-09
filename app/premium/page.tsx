'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { track } from '@/components/PostHogProvider';

export default function PremiumPage() {
  const { user, openAuth } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [busy, setBusy] = useState(false);

  async function checkout(plan: 'monthly' | 'annual') {
    track('checkout_clicked', { plan });
    if (!user) {
      openAuth('signup');
      return;
    }
    setBusy(true);
    try {
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
      alert(data.message || 'Stripe is not configured yet — coming very soon.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container premium">
      <div className="premium-hero">
        <h1>Date better, every time.</h1>
        <p>Premium gives you unlimited Plan My Date, smarter recommendations the more you use it, and the only date-night tool that learns who you are.</p>
        <div className="premium-toggle">
          <button className={!annual ? 'active' : ''} onClick={() => setAnnual(false)}>Monthly</button>
          <button className={annual ? 'active' : ''} onClick={() => setAnnual(true)}>Annual <span className="save">save 34%</span></button>
        </div>
      </div>

      <div className="premium-grid">
        <div className="premium-card">
          <h2>Free</h2>
          <div className="premium-price">$0</div>
          <div className="premium-period">Free forever</div>
          <ul>
            <li>Plan My Date — 3 free uses</li>
            <li>Browse all 309 venues</li>
            <li>Save up to 5 favorites</li>
            <li>Read date reviews</li>
            <li className="muted">🔒 Personalized recommendations</li>
            <li className="muted">🔒 Hidden Gems list</li>
            <li className="muted">🔒 Saved itineraries</li>
            <li className="muted">🔒 Post-date debrief</li>
          </ul>
          <Link href="/plan" className="cta cta-secondary">Try free</Link>
        </div>

        <div className="premium-card featured">
          <div className="premium-badge">MOST POPULAR</div>
          <h2>Premium</h2>
          <div className="premium-price">{annual ? '$79' : '$9.99'}<span>/{annual ? 'year' : 'month'}</span></div>
          <div className="premium-period">{annual ? 'That\'s $6.58/mo. Save $40.88/year.' : 'Billed monthly. Cancel anytime.'}</div>
          <ul>
            <li><strong>Unlimited</strong> Plan My Date</li>
            <li><strong>Personalized recommendations</strong> that learn from your dates</li>
            <li><strong>Post-date debrief</strong> — recommendations get smarter every time</li>
            <li><strong>Hidden Gems</strong> — curated off-the-radar spots</li>
            <li><strong>Saved itineraries</strong> — reuse plans that worked</li>
            <li><strong>Anniversary Mode</strong> — multi-day plans for milestones</li>
            <li><strong>Rescue Mode</strong> — rebuild a night in 10 seconds</li>
            <li>Unlimited favorites · Priority new-city access · Everything in Free</li>
          </ul>
          <button className="cta" disabled={busy} onClick={() => checkout(annual ? 'annual' : 'monthly')}>
            {busy ? 'Loading…' : `Get Premium · ${annual ? '$79/yr' : '$9.99/mo'}`}
          </button>
        </div>

        <div className="premium-card">
          <h2>Annual</h2>
          <div className="premium-price">$79<span>/year</span></div>
          <div className="premium-period">$6.58/mo · Save $40.88/yr</div>
          <ul>
            <li>Everything in Premium</li>
            <li><strong>Save 34%</strong> vs. monthly</li>
            <li>Locked rate — price won&apos;t increase</li>
            <li>Early access to new features</li>
            <li>Better for your cash flow</li>
          </ul>
          <button className="cta cta-secondary" disabled={busy} onClick={() => checkout('annual')}>
            Get Annual · $79/yr
          </button>
        </div>
      </div>

      <div className="premium-restaurant-cta">
        <p>Run a restaurant? <Link href="/for-restaurants">List your venue on DatingDex →</Link></p>
      </div>
    </div>
  );
}
