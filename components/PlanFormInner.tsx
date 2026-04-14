'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { track } from '@/components/PostHogProvider';
import { formatTime12h, glance12h, dedupeLeadingSentence } from '@/lib/format';

type CitySlug = 'dc' | 'nyc' | 'atlanta' | 'miami' | 'philly';

type Payload = {
  coldOpen: string;
  nightAtAGlance: string;
  producersNote: string;
  postDateText: string;
  bailoutLine?: string;
  extendLine: string;
  paymentNote?: string;
  timingSheet: {
    leaveBy: string;
    arriveBy: string;
    rideEstimateMin: number;
    reservationHoldMin: number;
  };
  weather?: { forecast: string; tempF: number; note: string };
  playlist?: { name: string; url: string; note: string };
};

type Itin = {
  stops: Array<{
    slot: string;
    startTime: string;
    durationMin: number;
    venue: { slug: string; name: string; neighborhood: string; price: string; vibe: string; photo: string | null };
    blurb?: string;
    beats?: { arrival?: string; whyThisWorks?: string; orderFirst?: string; insiderTip?: string };
    walkTo?: { minutes: number; line: string };
    conversationHook?: string;
    whatToWear?: string;
    photoSpot?: string;
    bookingUrl: string;
    bookingProvider: string;
  }>;
  totalEstimateUsd: [number, number];
  walkingMinutes: number;
  dressCode?: string;
  payload?: Payload;
};

const CITIES: { slug: CitySlug; name: string }[] = [
  { slug: 'dc', name: 'Washington, DC' },
  { slug: 'nyc', name: 'New York City' },
  { slug: 'atlanta', name: 'Atlanta' },
  { slug: 'miami', name: 'Miami' },
  { slug: 'philly', name: 'Philadelphia' },
];

const WHEN_OPTIONS = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'this-weekend', label: 'This weekend' },
  { id: 'pick-date', label: 'Pick a date' },
];

const OCCASIONS = [
  { id: 'first-date', label: 'First date', hint: 'Low-stakes, easy conversation' },
  { id: 'early-dates', label: 'Early dates', hint: '2nd\u20135th date, still impressing' },
  { id: 'regular', label: 'Regular date night', hint: 'Keeping the spark' },
  { id: 'special', label: 'Anniversary / birthday', hint: 'Something to remember' },
  { id: 'something-else', label: 'Something else', hint: 'Tell us' },
];

const VIBES = [
  { id: 'impressive', label: 'Impressive', hint: 'Show up, don\u2019t overthink it' },
  { id: 'intimate', label: 'Intimate', hint: 'Close, warm, low-lit' },
  { id: 'low-pressure', label: 'Low-pressure', hint: 'Fun over formal' },
  { id: 'classic-romantic', label: 'Classic romantic', hint: 'Candles, wine, the thing' },
  { id: 'adventurous', label: 'Adventurous', hint: 'A little unusual' },
  { id: 'something-else', label: 'Something else', hint: 'Tell us' },
];

const SHAPES = [
  { id: 'dinner-only', label: 'Just dinner', hint: 'One spot, done right' },
  { id: 'drinks-and-dinner', label: 'Drinks + dinner', hint: 'Two-stop classic' },
  { id: 'full-night', label: 'Full night', hint: 'Drinks \u2192 dinner \u2192 after-spot' },
];

const BUDGETS = [
  { id: 'under-60', label: 'Under $60' },
  { id: '60-120', label: '$60\u2013120' },
  { id: '120-200', label: '$120\u2013200' },
  { id: '200-plus', label: '$200+' },
  { id: 'flexible', label: 'Flexible' },
];

const ACTIVITIES = [
  { id: 'none', label: 'Just food & drinks' },
  { id: 'live-music', label: 'Live music' },
  { id: 'active', label: 'Something active' },
  { id: 'creative', label: 'Creative (art, games)' },
  { id: 'outdoor', label: 'Outdoor' },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`plan-chip${active ? ' active' : ''}`} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  );
}

function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div className="wiz-dots" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`wiz-dot${i <= step ? ' on' : ''}`} />
      ))}
    </div>
  );
}

export default function PlanFormInner() {
  const searchParams = useSearchParams();
  const { user, openAuth, isPremium, profile } = useAuth();

  const cityParam = searchParams.get('city') as CitySlug | null;
  const validCityParam: CitySlug | null = cityParam && CITIES.some((c) => c.slug === cityParam) ? cityParam : null;

  // 6-question wizard state
  const [step, setStep] = useState(0);
  const [city, setCity] = useState<CitySlug>(validCityParam || 'dc');
  const [when, setWhen] = useState<string>('this-weekend');
  const [dateAt, setDateAt] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [occasionNote, setOccasionNote] = useState('');
  const [vibe, setVibe] = useState<string>('');
  const [vibeNote, setVibeNote] = useState('');
  const [shape, setShape] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [activity, setActivity] = useState<string>('none');

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ shareId: string | null; tier: string; itinerary: Itin; payload: Payload; shareBlurb: string; usesRemaining: number | null; nextWall?: string; upsellMessage?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Email wall state
  const [emailWall, setEmailWall] = useState(false);
  const [signupWall, setSignupWall] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [email, setEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [capturedEmail, setCapturedEmail] = useState<string | null>(null);

  // City from geo (best-effort)
  useEffect(() => {
    if (validCityParam) return;
    fetch('/api/city-hint')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.city) setCity(d.city);
      })
      .catch(() => {});
  }, [validCityParam]);

  // Restore captured email across submissions
  useEffect(() => {
    try {
      const e = sessionStorage.getItem('ddx_capture_email');
      if (e) setCapturedEmail(e);
    } catch {}
  }, []);

  // Showing the activity step is DC-only
  const showActivity = city === 'dc';
  const totalSteps = showActivity ? 7 : 6;

  const steps: Array<{ title: string; render: () => React.ReactNode; valid: () => boolean }> = [
    {
      title: 'Which city?',
      valid: () => !!city,
      render: () => (
        <div className="plan-chips">
          {CITIES.map((c) => (
            <Chip key={c.slug} active={city === c.slug} onClick={() => { setCity(c.slug); advanceIfValid(); }}>{c.name}</Chip>
          ))}
        </div>
      ),
    },
    {
      title: 'When?',
      valid: () => !!when && (when !== 'pick-date' || !!dateAt),
      render: () => (
        <>
          <div className="plan-chips">
            {WHEN_OPTIONS.map((w) => (
              <Chip key={w.id} active={when === w.id} onClick={() => {
                setWhen(w.id);
                if (w.id !== 'pick-date') advanceIfValid();
              }}>{w.label}</Chip>
            ))}
          </div>
          {when === 'pick-date' && (
            <input
              type="datetime-local"
              className="wiz-date-input"
              value={dateAt}
              onChange={(e) => setDateAt(e.target.value)}
              aria-label="Pick a date and time"
            />
          )}
        </>
      ),
    },
    {
      title: 'What are you planning?',
      valid: () => !!occasion && (occasion !== 'something-else' || !!occasionNote.trim()),
      render: () => (
        <>
          <div className="plan-chips stack">
            {OCCASIONS.map((o) => (
              <Chip key={o.id} active={occasion === o.id} onClick={() => {
                setOccasion(o.id);
                if (o.id !== 'something-else') advanceIfValid();
              }}>
                <span className="chip-label">{o.label}</span>
                <span className="chip-hint">{o.hint}</span>
              </Chip>
            ))}
          </div>
          {occasion === 'something-else' && (
            <input
              type="text"
              className="wiz-text-input"
              placeholder="e.g., reconnecting after a rough month"
              value={occasionNote}
              onChange={(e) => setOccasionNote(e.target.value)}
            />
          )}
        </>
      ),
    },
    {
      title: 'What\u2019s the vibe?',
      valid: () => !!vibe && (vibe !== 'something-else' || !!vibeNote.trim()),
      render: () => (
        <>
          <div className="plan-chips stack">
            {VIBES.map((v) => (
              <Chip key={v.id} active={vibe === v.id} onClick={() => {
                setVibe(v.id);
                if (v.id !== 'something-else') advanceIfValid();
              }}>
                <span className="chip-label">{v.label}</span>
                <span className="chip-hint">{v.hint}</span>
              </Chip>
            ))}
          </div>
          {vibe === 'something-else' && (
            <input
              type="text"
              className="wiz-text-input"
              placeholder="e.g., fancy but not stiff"
              value={vibeNote}
              onChange={(e) => setVibeNote(e.target.value)}
            />
          )}
        </>
      ),
    },
    {
      title: 'Shape of the night?',
      valid: () => !!shape,
      render: () => (
        <div className="plan-chips stack">
          {SHAPES.map((s) => (
            <Chip key={s.id} active={shape === s.id} onClick={() => { setShape(s.id); advanceIfValid(); }}>
              <span className="chip-label">{s.label}</span>
              <span className="chip-hint">{s.hint}</span>
            </Chip>
          ))}
        </div>
      ),
    },
    {
      title: 'Budget?',
      valid: () => !!budget,
      render: () => (
        <div className="plan-chips">
          {BUDGETS.map((b) => (
            <Chip key={b.id} active={budget === b.id} onClick={() => { setBudget(b.id); advanceIfValid(); }}>{b.label}</Chip>
          ))}
        </div>
      ),
    },
  ];

  if (showActivity) {
    steps.push({
      title: 'Add an activity? (optional, DC only)',
      valid: () => true,
      render: () => (
        <div className="plan-chips">
          {ACTIVITIES.map((a) => (
            <Chip key={a.id} active={activity === a.id} onClick={() => { setActivity(a.id); advanceIfValid(); }}>{a.label}</Chip>
          ))}
        </div>
      ),
    });
  }

  function advanceIfValid() {
    // micro-delay so the chip click animates
    setTimeout(() => {
      setStep((s) => {
        if (!steps[s]?.valid()) return s;
        return Math.min(s + 1, steps.length);
      });
    }, 80);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  const ready = step >= steps.length && steps.every((s) => s.valid());

  async function submit() {
    setErr(null);
    setPaywall(false);
    setEmailWall(false);
    setSignupWall(false);
    track('plan_started', {
      city, when, occasion, vibe, shape, budget, activity,
      user: !!user, emailCaptured: !!capturedEmail,
    });
    setBusy(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          city,
          when,
          dateAt: when === 'pick-date' ? dateAt : undefined,
          occasion,
          occasionNote,
          vibe,
          vibeNote,
          shape,
          budget,
          activity,
          capturedEmail: capturedEmail || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 402 && data.error === 'email_wall') {
        setEmailWall(true);
        track('plan_email_wall_hit');
        setBusy(false);
        return;
      }
      if (res.status === 402 && data.error === 'signup_wall') {
        setSignupWall(true);
        track('plan_signup_wall_hit');
        setBusy(false);
        return;
      }
      if (res.status === 402 && data.error === 'paywall') {
        setPaywall(true);
        track('plan_paywall_hit');
        setBusy(false);
        return;
      }
      if (res.status === 409 && data.error === 'already_converted') {
        setEmailErr('Looks like you already have an account. Log in to continue.');
        openAuth('signin');
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error(data.message || 'Failed to plan.');
      setResult(data);
      track('plan_completed', { share_id: data.shareId, tier: data.tier });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailErr(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailErr('Enter a valid email address.');
      return;
    }
    setEmailBusy(true);
    try {
      const res = await fetch('/api/capture-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source: 'email_wall', marketingOptIn: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to capture email.');
      try { sessionStorage.setItem('ddx_capture_email', email); } catch {}
      setCapturedEmail(email);
      setEmailWall(false);
      track('email_captured', { source: 'email_wall' });
      // Immediately retry plan submission
      await submit();
    } catch (e: any) {
      setEmailErr(e.message);
    } finally {
      setEmailBusy(false);
    }
  }

  // Keyboard: Enter = advance / Esc = back
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (result || emailWall || signupWall || paywall) return;
      if (e.key === 'Enter' && step < steps.length) {
        if (steps[step]?.valid()) advanceIfValid();
      }
      if (e.key === 'Escape' && step > 0) back();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, result, emailWall, signupWall, paywall, city, when, dateAt, occasion, occasionNote, vibe, vibeNote, shape, budget]);

  // If all steps done and not submitted yet, auto-submit
  useEffect(() => {
    if (ready && !busy && !result && !err && !emailWall && !signupWall && !paywall) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ---- Render ----
  if (result) {
    return <PlanResult result={result} />;
  }

  if (paywall) {
    return (
      <div className="container plan-page" id="planner">
        <div className="paywall">
          <h2>Your free plans are done.</h2>
          <p>Three plans in, you\u2019ve seen what this does. Premium gives you unlimited plans, the post-date debrief, saved nights, calendar drops, PDF exports, and Couples Mode when it ships.</p>
          <Link href="/premium" className="cta">See Premium \u2192</Link>
        </div>
      </div>
    );
  }

  if (signupWall) {
    return (
      <div className="container plan-page" id="planner">
        <div className="paywall">
          <h2>One more free plan.</h2>
          <p>Create a free account to get one more on us, save your plans, and unlock the post-date debrief.</p>
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button className="cta" onClick={() => openAuth('signup')}>Sign up free \u2192</button>
            <button className="cta cta-secondary" onClick={() => openAuth('signin')}>Log in</button>
          </div>
        </div>
      </div>
    );
  }

  if (emailWall) {
    return (
      <div className="container plan-page" id="planner">
        <div className="paywall">
          <h2>One more free plan \u2014 drop your email.</h2>
          <p>That was your first. Enter your email and we\u2019ll plan another one, plus send you the occasional genuinely useful thing. No spam, unsubscribe anytime.</p>
          <form onSubmit={submitEmail} className="wiz-email-form">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="wiz-text-input"
              autoFocus
              required
            />
            {emailErr && <div className="auth-err">{emailErr}</div>}
            <button type="submit" className="cta" disabled={emailBusy}>
              {emailBusy ? 'Saving\u2026' : 'Get my next plan \u2192'}
            </button>
          </form>
          <p className="wiz-fineprint">
            Already have an account? <button type="button" className="link-btn" onClick={() => openAuth('signin')}>Log in</button>
          </p>
        </div>
      </div>
    );
  }

  const current = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="container plan-page" id="planner">
      <div className="plan-header">
        <h2>Plan My Date <span className="ai-tag">AI</span></h2>
        <p className="plan-sub">A fully produced night \u2014 where to go, what to order, what to say, what to wear.</p>
        {user && !isPremium && profile && (
          <div className="plan-quota">
            {Math.max(0, 1 - (profile.plan_uses_count || 0))} of 1 free account plan remaining &middot;{' '}
            <Link href="/premium">Go unlimited</Link>
          </div>
        )}
      </div>

      {busy ? (
        <div className="wiz-loading">
          <div className="wiz-spinner" />
          <p>Producing your night\u2026</p>
          <p className="wiz-loading-sub">Cold open, stops, timing, playlist, weather \u2014 it takes about 20 seconds.</p>
        </div>
      ) : (
        <div className="wiz">
          <Dots step={step} total={steps.length} />
          <h3 className="wiz-q">{current?.title}</h3>
          {current?.render()}
          <div className="wiz-nav">
            {step > 0 && (
              <button type="button" className="cta cta-ghost" onClick={back}>\u2190 Back</button>
            )}
            {step < steps.length - 1 && current?.valid() && (
              <button type="button" className="cta cta-secondary" onClick={advanceIfValid}>Next \u2192</button>
            )}
            {step === steps.length - 1 && current?.valid() && (
              <button type="button" className="cta" onClick={submit}>Build my night \u2726</button>
            )}
          </div>
          {err && <div className="auth-err">{err}</div>}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// PlanResult \u2014 the rich render
// ------------------------------------------------------------

function PlanResult({ result }: { result: { shareId: string | null; tier: string; itinerary: Itin; payload: Payload; shareBlurb: string; usesRemaining: number | null; nextWall?: string; upsellMessage?: string } }) {
  const { openAuth, user, isPremium } = useAuth();
  const { itinerary, payload, shareId } = result;
  const [copied, setCopied] = useState(false);

  async function copyShareLink() {
    if (!shareId) return;
    const url = `${window.location.origin}/plan/${shareId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    track('share_link_copied', { share_id: shareId });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="container plan-result-v3">
      {/* 1. Cold open */}
      <div className="plan-cold-open">\u201c{payload.coldOpen}\u201d</div>

      {/* 2. Night at a glance */}
      <div className="plan-glance">{glance12h(payload.nightAtAGlance)}</div>

      {result.upsellMessage && (
        <div className="plan-anon-nudge">
          <span>{result.upsellMessage}</span>
          {!user && (
            <button type="button" className="cta cta-primary" onClick={() => openAuth('signup')}>Save this plan \u2192</button>
          )}
        </div>
      )}

      {/* Timing + weather strip */}
      <div className="plan-strip">
        <div className="plan-strip-col">
          <div className="plan-strip-label">Leave by</div>
          <div className="plan-strip-value">{formatTime12h(payload.timingSheet.leaveBy)}</div>
          <div className="plan-strip-sub">Ride ~{payload.timingSheet.rideEstimateMin}min \u00b7 ET</div>
        </div>
        <div className="plan-strip-col">
          <div className="plan-strip-label">Arrive</div>
          <div className="plan-strip-value">{formatTime12h(payload.timingSheet.arriveBy)}</div>
          <div className="plan-strip-sub">Table holds {payload.timingSheet.reservationHoldMin}min</div>
        </div>
        {payload.weather && (
          <div className="plan-strip-col">
            <div className="plan-strip-label">Weather</div>
            <div className="plan-strip-value">{payload.weather.tempF}\u00b0F</div>
            <div className="plan-strip-sub">{payload.weather.note}</div>
          </div>
        )}
        {payload.playlist && (
          <div className="plan-strip-col">
            <div className="plan-strip-label">Pre-date playlist</div>
            <a href={payload.playlist.url} target="_blank" rel="noopener noreferrer" className="plan-strip-link">
              {payload.playlist.name} \u2192
            </a>
            <div className="plan-strip-sub">{payload.playlist.note}</div>
          </div>
        )}
      </div>

      {/* 3. Stops */}
      {itinerary.stops.map((s, i) => (
        <article key={i} className="plan-stop-v3">
          <div className="plan-stop-header">
            <div className="plan-stop-time">
              <div className="plan-stop-slot">{s.slot === 'main' ? 'Main' : s.slot === 'before' ? 'Drinks' : s.slot === 'activity' ? 'Activity' : 'After'}</div>
              <div className="plan-stop-clock">{formatTime12h(s.startTime)}</div>
              <div className="plan-stop-dur">{s.durationMin} min</div>
            </div>
            <div className="plan-stop-title">
              <h3>{s.venue.name}</h3>
              <div className="plan-stop-meta">{s.venue.neighborhood} \u00b7 {s.venue.price}</div>
            </div>
          </div>

          {s.blurb && <p className="plan-stop-blurb">{dedupeLeadingSentence(s.blurb)}</p>}

          {s.beats && (
            <div className="plan-beats">
              {s.beats.arrival && (
                <div className="plan-beat"><span className="plan-beat-label">Walk in:</span> {s.beats.arrival}</div>
              )}
              {s.beats.whyThisWorks && (
                <div className="plan-beat"><span className="plan-beat-label">Why this:</span> {s.beats.whyThisWorks}</div>
              )}
              {s.beats.orderFirst && (
                <div className="plan-beat"><span className="plan-beat-label">Order first:</span> {s.beats.orderFirst}</div>
              )}
              {s.beats.insiderTip && (
                <div className="plan-beat"><span className="plan-beat-label">Insider:</span> {s.beats.insiderTip}</div>
              )}
            </div>
          )}

          <div className="plan-stop-extras">
            {s.whatToWear && <div className="plan-extra"><strong>Wear:</strong> {s.whatToWear}</div>}
            {s.photoSpot && <div className="plan-extra"><strong>Photo spot:</strong> {s.photoSpot}</div>}
          </div>

          <div className="plan-stop-actions">
            <a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="plan-book-btn"
               onClick={() => track('booking_clicked', { provider: s.bookingProvider, venue: s.venue.slug })}>
              {s.bookingProvider === 'walk-in' ? 'Get directions \u2192' : 'Find a table \u2192'}
            </a>
          </div>

          {s.walkTo && i < itinerary.stops.length - 1 && (
            <div className="plan-walk">
              <span className="plan-walk-badge">{s.walkTo.minutes}m walk</span>
              <span className="plan-walk-line">{s.walkTo.line}</span>
            </div>
          )}
        </article>
      ))}

      {/* Conversation hooks */}
      {payload && (payload as any).conversationHooks?.length > 0 && (
        <div className="plan-section">
          <h3>Conversation hooks</h3>
          <ul className="plan-hooks">
            {(payload as any).conversationHooks.map((h: string, i: number) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      {/* Payment note */}
      {payload.paymentNote && (
        <div className="plan-section">
          <h3>At the bill</h3>
          <p>{payload.paymentNote}</p>
        </div>
      )}

      {/* Bailout / extend */}
      {(payload.bailoutLine || payload.extendLine) && (
        <div className="plan-section plan-section-split">
          {payload.extendLine && (
            <div>
              <h4>If it\u2019s going great</h4>
              <p>{payload.extendLine}</p>
            </div>
          )}
          {payload.bailoutLine && (
            <div>
              <h4>If you need out</h4>
              <p>{payload.bailoutLine}</p>
            </div>
          )}
        </div>
      )}

      {/* Post-date text */}
      {payload.postDateText && (
        <div className="plan-section">
          <h3>Morning-after text (optional)</h3>
          <p className="plan-text-msg">\u201c{payload.postDateText}\u201d</p>
          <button
            type="button"
            className="cta cta-ghost"
            onClick={() => { navigator.clipboard.writeText(payload.postDateText); track('post_text_copied'); }}
          >Copy text</button>
        </div>
      )}

      {/* Producer's note */}
      {payload.producersNote && (
        <div className="plan-producers-note">
          <p>{payload.producersNote}</p>
          <p className="plan-producers-sig">\u2014 DatingDex</p>
        </div>
      )}

      {/* Action bar */}
      <div className="plan-action-bar">
        {shareId && (
          <>
            <Link href={`/plan/${shareId}`} className="cta cta-secondary">View full plan \u2192</Link>
            <button type="button" className="cta cta-ghost" onClick={copyShareLink}>
              {copied ? 'Copied!' : 'Copy share link'}
            </button>
            <a href={`/api/plan/${shareId}/ics`} className="cta cta-ghost" onClick={() => track('ics_downloaded')}>
              Add to calendar
            </a>
            <a href={`/api/plan/${shareId}/pdf`} target="_blank" rel="noopener noreferrer" className="cta cta-ghost" onClick={() => track('pdf_downloaded')}>
              Download PDF
            </a>
          </>
        )}
      </div>
    </div>
  );
}
