'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { track } from '@/components/PostHogProvider';

type Itin = {
  stops: Array<{
    slot: string;
    startTime: string;
    durationMin: number;
    venue: { slug: string; name: string; neighborhood: string; price: string; vibe: string; photo: string | null };
    blurb?: string;
    bookingUrl: string;
    bookingProvider: string;
  }>;
  totalEstimateUsd: [number, number];
  walkingMinutes: number;
};

const SITUATIONS = [
  { id: 'first-date', label: 'First date' },
  { id: 'second-date', label: 'Second date' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'casual-hang', label: 'Casual hang' },
  { id: 'make-it-up', label: 'Make it up to them' },
];
const VIBES = [
  { id: 'low-pressure', label: 'Low pressure' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'fun-playful', label: 'Fun & playful' },
  { id: 'impressive', label: 'Impressive' },
  { id: 'sexy', label: 'Sexy' },
];
const ACTIVITIES = [
  { id: 'dinner', label: 'Dinner' },
  { id: 'drinks-only', label: 'Drinks only' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'activity', label: 'Activity' },
  { id: 'full-evening', label: 'Full evening' },
];
const BUDGETS = [
  { id: 'under-30', label: 'Under $30' },
  { id: '30-60', label: '$30–60' },
  { id: '60-100', label: '$60–100' },
  { id: 'no-limit', label: 'No limit' },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`plan-chip${active ? ' active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const { user, openAuth, isPremium, profile } = useAuth();
  const [freeText, setFreeText] = useState('');
  const [situation, setSituation] = useState('first-date');
  const [vibe, setVibe] = useState('romantic');
  const [activity, setActivity] = useState('dinner');
  const [budget, setBudget] = useState('30-60');
  const [dateAt, setDateAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ shareId: string; itinerary: Itin; shareBlurb: string; usesRemaining: number | null } | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPaywall(false);
    track('plan_started', { situation, vibe, activity, budget, has_free_text: !!freeText });
    if (!user) {
      track('plan_blocked_logged_out');
      openAuth('signup');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ situation, vibe, activity, budget, dateAt, freeText }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setPaywall(true);
        track('plan_paywall_hit');
        return;
      }
      if (!res.ok) throw new Error(data.message || 'Failed to plan.');
      setResult(data);
      track('plan_completed', { share_id: data.shareId, uses_remaining: data.usesRemaining });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container plan-page">
      <div className="plan-header">
        <h1>Plan My Date <span className="ai-tag">AI</span></h1>
        <p className="plan-sub">
          Tell us about the date in your own words, or use the chips below. We&apos;ll build a full timestamped night —
          where to go, when to arrive, what to order, and how to book.
        </p>
        {user && !isPremium && profile && (
          <div className="plan-quota">
            {Math.max(0, 3 - (profile.plan_uses_count || 0))} of 3 free plans remaining ·{' '}
            <Link href="/premium">Go unlimited</Link>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="plan-form">
        <label className="plan-field">
          <span className="plan-label">Tell us about it (optional, but recommended)</span>
          <textarea
            className="plan-textarea"
            placeholder="It's our 2nd date, she likes natural wine and hates loud places, I want to seem thoughtful but not try-hard, $120 budget for the night."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
          />
        </label>

        <div className="plan-field">
          <span className="plan-label">What&apos;s the situation?</span>
          <div className="plan-chips">
            {SITUATIONS.map((s) => (
              <Chip key={s.id} active={situation === s.id} onClick={() => setSituation(s.id)}>{s.label}</Chip>
            ))}
          </div>
        </div>

        <div className="plan-field">
          <span className="plan-label">Vibe?</span>
          <div className="plan-chips">
            {VIBES.map((v) => (
              <Chip key={v.id} active={vibe === v.id} onClick={() => setVibe(v.id)}>{v.label}</Chip>
            ))}
          </div>
        </div>

        <div className="plan-field">
          <span className="plan-label">What are you doing?</span>
          <div className="plan-chips">
            {ACTIVITIES.map((a) => (
              <Chip key={a.id} active={activity === a.id} onClick={() => setActivity(a.id)}>{a.label}</Chip>
            ))}
          </div>
        </div>

        <div className="plan-field">
          <span className="plan-label">Budget per person</span>
          <div className="plan-chips">
            {BUDGETS.map((b) => (
              <Chip key={b.id} active={budget === b.id} onClick={() => setBudget(b.id)}>{b.label}</Chip>
            ))}
          </div>
        </div>

        <label className="plan-field">
          <span className="plan-label">When is the date? (optional)</span>
          <input
            type="datetime-local"
            className="plan-input"
            value={dateAt}
            onChange={(e) => setDateAt(e.target.value)}
          />
        </label>

        {err && <div className="auth-err">{err}</div>}
        <button type="submit" className="cta plan-submit" disabled={busy}>
          {busy ? 'Building your night…' : 'Build my date night ✦'}
        </button>
      </form>

      {paywall && (
        <div className="paywall">
          <h2>You&apos;ve used your 3 free plans</h2>
          <p>Premium gives you unlimited Plan My Date, smarter recommendations the more you use it, the post-date debrief that makes your next plan better, and saved itineraries you can reuse.</p>
          <Link href="/premium" className="cta">See Premium →</Link>
        </div>
      )}

      {result && (
        <div className="plan-result">
          <div className="plan-result-head">
            <h2>Your night ✦</h2>
            <p>Estimated total: ${result.itinerary.totalEstimateUsd[0]}–${result.itinerary.totalEstimateUsd[1]} for two · {result.itinerary.walkingMinutes} min walking between stops</p>
            <div className="plan-share">
              <Link href={`/plan/${result.shareId}`} className="cta cta-secondary">View &amp; share this plan →</Link>
            </div>
          </div>
          {result.itinerary.stops.map((s, i) => (
            <article key={i} className="plan-stop">
              <div className="plan-stop-time">
                <div className="plan-stop-slot">{s.slot === 'main' ? 'Main' : s.slot === 'before' ? 'Before' : 'After'}</div>
                <div className="plan-stop-clock">{s.startTime}</div>
                <div className="plan-stop-dur">{s.durationMin} min</div>
              </div>
              <div className="plan-stop-body">
                <h3>{s.venue.name}</h3>
                <div className="plan-stop-meta">{s.venue.neighborhood} · {s.venue.price} · {s.venue.vibe}</div>
                <p className="plan-stop-blurb">{s.blurb}</p>
                <a
                  href={s.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plan-book-btn"
                  onClick={() => track('booking_clicked', { provider: s.bookingProvider, venue: s.venue.slug })}
                >
                  {s.bookingProvider === 'resy' ? 'Book on Resy →' : s.bookingProvider === 'opentable' ? 'Book on OpenTable →' : 'Get directions →'}
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
