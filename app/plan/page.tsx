'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { track } from '@/components/PostHogProvider';
import { allNeighborhoods } from '@/lib/venues';

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
  dressCode?: string;
};

type Copilot = {
  dressCode: string;
  conversationOpeners: string[];
  postDateText: string;
  arrivalTip: string;
};

const VIBES = [
  { id: 'low-pressure', label: 'Low pressure' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'fun-playful', label: 'Fun & playful' },
  { id: 'impressive', label: 'Impressive' },
  { id: 'sexy', label: 'Sexy' },
];

const NEIGHBORHOODS = allNeighborhoods().slice(0, 12);

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`plan-chip${active ? ' active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default function PlanPageWrapper() {
  return (
    <Suspense fallback={<div className="container plan-page"><div className="plan-header"><h1>Plan My Date <span className="ai-tag">AI</span></h1></div></div>}>
      <PlanPage />
    </Suspense>
  );
}

function PlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuth, isPremium, profile } = useAuth();

  // Pre-select vibe based on mode from homepage doors
  const mode = searchParams.get('mode');
  const defaultVibe = mode === 'tonight' ? 'fun-playful' : mode === 'impress' ? 'impressive' : 'romantic';

  const [freeText, setFreeText] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [vibe, setVibe] = useState(defaultVibe);
  const [budget, setBudget] = useState(75);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    shareId: string;
    itinerary: Itin;
    shareBlurb: string;
    copilot?: Copilot;
    usesRemaining: number | null;
  } | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Map dollar budget to legacy bucket for API
  function budgetToBucket(val: number): string {
    if (val < 30) return 'under-30';
    if (val <= 60) return '30-60';
    if (val <= 100) return '60-100';
    return 'no-limit';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPaywall(false);
    setCopied(false);
    track('plan_started', { neighborhood, vibe, budget, has_free_text: !!freeText });
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
        body: JSON.stringify({
          neighborhood,
          vibe,
          budget: budgetToBucket(budget),
          activity: mode === 'tonight' ? 'full-evening' : 'dinner',
          situation: mode === 'impress' ? 'anniversary' : 'first-date',
          freeText,
        }),
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

  async function copyShareLink() {
    if (!result) return;
    const url = `${window.location.origin}/plan/${result.shareId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    track('share_link_copied', { share_id: result.shareId });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="container plan-page">
      <div className="plan-header">
        <h1>Plan My Date <span className="ai-tag">AI</span></h1>
        <p className="plan-sub">
          3 questions. 30 seconds. A fully choreographed night — where to go, when to arrive, what to order, what to say.
        </p>
        {user && !isPremium && profile && (
          <div className="plan-quota">
            {Math.max(0, 3 - (profile.plan_uses_count || 0))} of 3 free plans remaining ·{' '}
            <Link href="/premium">Go unlimited</Link>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="plan-form">
        {/* Q1: Neighborhood */}
        <div className="plan-field">
          <span className="plan-label">Where in DC?</span>
          <div className="plan-chips">
            <Chip active={neighborhood === ''} onClick={() => setNeighborhood('')}>Anywhere</Chip>
            {NEIGHBORHOODS.map((n) => (
              <Chip key={n.slug} active={neighborhood === n.slug} onClick={() => setNeighborhood(n.slug)}>
                {n.name}
              </Chip>
            ))}
          </div>
        </div>

        {/* Q2: Vibe */}
        <div className="plan-field">
          <span className="plan-label">What&apos;s the vibe?</span>
          <div className="plan-chips">
            {VIBES.map((v) => (
              <Chip key={v.id} active={vibe === v.id} onClick={() => setVibe(v.id)}>{v.label}</Chip>
            ))}
          </div>
        </div>

        {/* Q3: Budget (dollar slider) */}
        <div className="plan-field">
          <span className="plan-label">Budget for the night (both of you): <strong>${budget}</strong></span>
          <input
            type="range"
            min={20}
            max={300}
            step={10}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="plan-slider"
          />
          <div className="plan-slider-labels">
            <span>$20</span>
            <span>$100</span>
            <span>$200</span>
            <span>$300+</span>
          </div>
        </div>

        {/* Optional: free text */}
        <label className="plan-field plan-field-optional">
          <span className="plan-label">Anything else? <span className="plan-optional-tag">optional</span></span>
          <textarea
            className="plan-textarea"
            placeholder="She likes natural wine and hates loud places. I want to seem thoughtful but not try-hard."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={2}
          />
        </label>

        {err && <div className="auth-err">{err}</div>}
        <button type="submit" className="cta plan-submit" disabled={busy}>
          {busy ? 'Choreographing your night…' : 'Build my date night ✦'}
        </button>
      </form>

      {paywall && (
        <div className="paywall">
          <h2>You&apos;ve used your 3 free plans</h2>
          <p>Pro gives you unlimited plans, Date Copilot (what to wear, say, and text after), and recommendations that learn from every date.</p>
          <Link href="/premium" className="cta">See Pro →</Link>
        </div>
      )}

      {result && (
        <div className="plan-result">
          <div className="plan-result-head">
            <h2>Your night ✦</h2>
            <p>Estimated total: ${result.itinerary.totalEstimateUsd[0]}–${result.itinerary.totalEstimateUsd[1]} for two · {result.itinerary.walkingMinutes} min walking between stops</p>
            {result.itinerary.dressCode && (
              <div className="plan-dress-code">
                <strong>What to wear:</strong> {result.itinerary.dressCode}
              </div>
            )}
            <div className="plan-share-row">
              <Link href={`/plan/${result.shareId}`} className="cta cta-secondary plan-share-btn">View full plan →</Link>
              <button className="cta cta-ghost plan-share-btn" onClick={copyShareLink}>
                {copied ? 'Copied!' : 'Copy share link'}
              </button>
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

          {/* Date Copilot — Pro only */}
          {result.copilot && (
            <div className="copilot-section">
              <div className="copilot-badge">Date Copilot <span className="ai-tag">PRO</span></div>

              {result.copilot.arrivalTip && (
                <div className="copilot-card">
                  <h4>When you arrive</h4>
                  <p>{result.copilot.arrivalTip}</p>
                </div>
              )}

              {result.copilot.conversationOpeners?.length > 0 && (
                <div className="copilot-card">
                  <h4>Conversation starters</h4>
                  <ul className="copilot-openers">
                    {result.copilot.conversationOpeners.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.copilot.postDateText && (
                <div className="copilot-card">
                  <h4>The follow-up text</h4>
                  <p className="copilot-text-msg">&ldquo;{result.copilot.postDateText}&rdquo;</p>
                  <button
                    className="copilot-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(result.copilot!.postDateText);
                      track('copilot_text_copied');
                    }}
                  >
                    Copy text
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Copilot upsell for free users */}
          {!result.copilot && !isPremium && (
            <div className="copilot-upsell">
              <div className="copilot-badge">Date Copilot <span className="ai-tag">PRO</span></div>
              <p>What to wear. 3 conversation starters tied to your venues. A follow-up text to send after.</p>
              <Link href="/premium" className="cta cta-secondary">Unlock Date Copilot →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
