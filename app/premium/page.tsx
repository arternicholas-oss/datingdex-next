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
        <p>Pro gives you unlimited plans, Date Copilot — the only AI that tells you what to wear, say, and text after — and recommendations that learn who you are.</p>
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
            <li>Choreographed itineraries</li>
            <li>Resy / OpenTable booking links</li>
            <li className="muted">🔒 Date Copilot (dress code, scripts, follow-up text)</li>
            <li className="muted">🔒 Personalized recommendations</li>
            <li className="muted">🔒 Couples Mode</li>
            <li className="muted">🔒 Post-date debrief</li>
          </ul>
          <Link href="/plan" className="cta cta-secondary">Try free</Link>
        </div>

        <div className="premium-card featured">
          <div className="premium-badge">MOST POPULAR</div>
          <h2>Pro</h2>
          <div className="premium-price">{annual ? '$95' : '$12'}<span>/{annual ? 'year' : 'month'}</span></div>
          <div className="premium-period">{annual ? 'That\'s $7.92/mo. Save $49/year.' : 'Billed monthly. Cancel anytime.'}</div>
          <ul>
            <li><strong>Unlimited</strong> Plan My Date</li>
            <li><strong>Date Copilot</strong> — dress code, 3 conversation starters, follow-up text</li>
            <li><strong>Personalized recommendations</strong> that learn from your dates</li>
            <li><strong>Post-date debrief</strong> — plans get smarter every time</li>
            <li><strong>Couples Mode</strong> — shared favorites, voting, anniversary reminders</li>
            <li><strong>Share cards</strong> — branded itinerary images for social</li>
            <li><strong>No-repeat venues</strong> for 60 days after each date</li>
            <li>Priority new-city access · Everything in Free</li>
          </ul>
          <button className="cta" disabled={busy} onClick={() => checkout(annual ? 'annual' : 'monthly')}>
            {busy ? 'Loading…' : `Get Pro · ${annual ? '$95/yr' : '$12/mo'}`}
          </button>
        </div>

        <div className="premium-card">
          <h2>Annual</h2>
          <div className="premium-price">$95<span>/year</span></div>
          <div className="premium-period">$7.92/mo · Save $49/yr</div>
          <ul>
            <li>Everything in Pro</li>
            <li><strong>Save 34%</strong> vs. monthly</li>
            <li>Locked rate — price won&apos;t increase</li>
            <li>Early access to new features</li>
            <li>Better for your cash flow</li>
          </ul>
          <button className="cta cta-secondary" disabled={busy} onClick={() => checkout('annual')}>
            Get Annual · $95/yr
          </button>
        </div>
      </div>

      <div className="premium-restaurant-cta">
        <p>Run a restaurant? <Link href="/for-restaurants">List your venue on DatingDex →</Link></p>
      </div>
    </div>
  );
}
