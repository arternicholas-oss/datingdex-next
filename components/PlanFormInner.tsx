'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

const CITIES = [
  { slug: 'dc', name: 'Washington, DC' },
  { slug: 'nyc', name: 'New York City' },
  { slug: 'atlanta', name: 'Atlanta' },
  { slug: 'miami', name: 'Miami' },
  { slug: 'philly', name: 'Philadelphia' },
] as const;

type CitySlug = typeof CITIES[number]['slug'];

function cityLabel(slug: CitySlug): string {
  return CITIES.find((c) => c.slug === slug)?.name || 'your city';
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`plan-chip${active ? ' active' : ''}`} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  );
}

export default function PlanFormInner() {
  const searchParams = useSearchParams();
  const { user, openAuth, isPremium, profile } = useAuth();

  const mode = searchParams.get('mode');
  const cityParam = searchParams.get('city') as CitySlug | null;
  const validCityParam: CitySlug | null = cityParam && CITIES.some((c) => c.slug === cityParam) ? cityParam : null;
  const defaultVibe = mode === 'tonight' ? 'fun-playful' : mode === 'impress' ? 'impressive' : 'romantic';

  const [city, setCity] = useState<CitySlug>(validCityParam || 'dc');
  const [freeText, setFreeText] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [vibe, setVibe] = useState(defaultVibe);
  const [budget, setBudget] = useState(75);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    shareId: string | null;
    anonymous?: boolean;
    itinerary: Itin;
    shareBlurb: string;
    copilot?: Copilot;
    usesRemaining: number | null;
    upsellMessage?: string;
  } | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset neighborhood when city changes
  const neighborhoods = allNeighborhoods(city).slice(0, 12);

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
    track('plan_started', { city, neighborhood, vibe, budget, has_free_text: !!freeText, anonymous: !user });
    setBusy(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          city,
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
      if (res.status === 429 && data.error === 'anon_rate_limit') {
        setErr(data.message);
        track('plan_anon_rate_limited');
        openAuth('signup');
        return;
      }
      if (!res.ok) throw new Error(data.message || 'Failed to plan.');
      setResult(data);
      track('plan_completed', { share_id: data.shareId, anonymous: data.anonymous, uses_remaining: data.usesRemaining });
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

  async function downloadDateCard() {
    if (!result) return;
    track('date_card_downloaded', { share_id: result.shareId });
    const url = `/api/og/story/${result.shareId}`;
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `datingdex-${result.shareId}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="container plan-page" id="planner">
      <div className="plan-header">
        <h2>Plan My Date <span className="ai-tag">AI</span></h2>
        <p className="plan-sub">
          3 questions. 30 seconds. A fully choreographed night &mdash; where to go, when to arrive, what to order, what to say.
        </p>
        {user && !isPremium && profile && (
          <div className="plan-quota">
            {Math.max(0, 3 - (profile.plan_uses_count || 0))} of 3 free plans remaining &middot;{" "}
            <Link href="/premium">Go unlimited</Link>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="plan-form">
        <div className="plan-field">
          <span className="plan-label">Which city?</span>
          <div className="plan-chips">
            {CITIES.map((c) => (
              <Chip
                key={c.slug}
                active={city === c.slug}
                onClick={() => { setCity(c.slug); setNeighborhood(''); }}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="plan-field">
          <span className="plan-label">Where in {cityLabel(city)}?</span>
          <div className="plan-chips">
            <Chip active={neighborhood === ''} onClick={() => setNeighborhood('')}>Anywhere</Chip>
            {neighborhoods.map((n) => (
              <Chip key={n.slug} active={neighborhood === n.slug} onClick={() => setNeighborhood(n.slug)}>
                {n.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="plan-field">
          <span className="plan-label">What&apos;s the vibe?</span>
          <div className="plan-chips">
            {VIBES.map((v) => (
              <Chip key={v.id} active={vibe === v.id} onClick={() => setVibe(v.id)}>{v.label}</Chip>
            ))}
          </div>
        </div>

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
          <div className="plan-budget-hints">
            <span>Coffee date</span>
            <span>Casual dinner</span>
            <span>Cocktails + dinner</span>
            <span>The full experience</span>
          </div>
        </div>

        <div className="plan-field">
          <span className="plan-label">Anything else? <span className="plan-optional-tag">optional</span></span>
          <textarea
            className="plan-textarea"
            placeholder="Third date, she likes natural wine and hates loud places. I want somewhere intimate but not stuffy. $120 budget."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            aria-label="Describe your date in plain English"
          />
        </div>

        {err && <div className="auth-err">{err}</div>}
        <button type="submit" className={`cta plan-submit${busy ? " loading" : ""}`} disabled={busy}>
          {busy ? 'Choreographing your night\u2026' : 'Build my date night \u2726'}
        </button>
      </form>

      {paywall && (
        <div className="paywall">
          <h2>You&apos;ve used your 3 free plans</h2>
          <p>Pro gives you unlimited plans, Date Copilot (what to wear, say, and text after), and recommendations that learn from every date.</p>
          <Link href="/premium" className="cta">See Pro &rarr;</Link>
        </div>
      )}

      {result && (
        <div className="plan-result">
          {result.anonymous && result.upsellMessage && (
            <div className="plan-anon-nudge" style={{background:'var(--soft,#fff4f1)', border:'1px solid var(--border,#eee)', padding:'1rem 1.25rem', borderRadius:'12px', marginBottom:'1.5rem', display:'flex', flexWrap:'wrap', gap:'.75rem', alignItems:'center', justifyContent:'space-between'}}>
              <span style={{flex:'1 1 260px'}}>{result.upsellMessage}</span>
              <button type="button" className="cta cta-primary" onClick={() => openAuth('signup')}>Save this plan {'\u2192'}</button>
            </div>
          )}
          <div className="plan-result-head">
            <h2>Your night \u2726</h2>
            <p>Estimated total: ${result.itinerary.totalEstimateUsd[0]}&ndash;${result.itinerary.totalEstimateUsd[1]} for two &middot; {result.itinerary.walkingMinutes} min walking between stops</p>
            {result.itinerary.dressCode && (
              <div className="plan-dress-code">
                <strong>What to wear:</strong> {result.itinerary.dressCode}
              </div>
            )}
            {!result.anonymous && result.shareId && (
              <div className="plan-share-row">
                <Link href={`/plan/${result.shareId}`} className="cta cta-secondary plan-share-btn">View full plan &rarr;</Link>
                <button className="cta cta-ghost plan-share-btn" onClick={copyShareLink}>
                  {copied ? 'Copied!' : 'Copy share link'}
                </button>
                <button className="cta cta-ghost plan-share-btn" onClick={downloadDateCard}>
                  \ud83d\udcf8 Download Date Card
                </button>
              </div>
            )}
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
                <div className="plan-stop-meta">{s.venue.neighborhood} &middot; {s.venue.price} &middot; {s.venue.vibe}</div>
                <p className="plan-stop-blurb">{s.blurb}</p>
                <a
                  href={s.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plan-book-btn"
                  onClick={() => track('booking_clicked', { provider: s.bookingProvider, venue: s.venue.slug })}
                >
                  {s.bookingProvider === 'resy' ? 'Book on Resy \u2192' : s.bookingProvider === 'opentable' ? 'Book on OpenTable \u2192' : 'Get directions \u2192'}
                </a>
              </div>
            </article>
          ))}

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

          {!result.copilot && !isPremium && (
            <div className="copilot-upsell">
              <div className="copilot-badge">Date Copilot <span className="ai-tag">PRO</span></div>
              <p>What to wear. 3 conversation starters tied to your venues. A follow-up text to send after.</p>
              <Link href="/premium" className="cta cta-secondary">Unlock Date Copilot &rarr;</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
