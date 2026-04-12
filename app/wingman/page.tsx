'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { track } from '@/components/PostHogProvider';
import { allNeighborhoods } from '@/lib/venues';

const NEIGHBORHOODS = allNeighborhoods().slice(0, 12);

const VIBES = [
  { id: 'low-pressure', label: 'Low pressure' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'fun-playful', label: 'Fun & playful' },
  { id: 'impressive', label: 'Impressive' },
  { id: 'sexy', label: 'Sexy' },
];

const OCCASIONS = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'just-because', label: 'Just because' },
  { id: 'first-date-help', label: 'First date help' },
  { id: 'surprise', label: 'Surprise night out' },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`plan-chip${active ? ' active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default function WingmanPage() {
  const router = useRouter();
  const { user, openAuth } = useAuth();
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [occasion, setOccasion] = useState('just-because');
  const [personalNote, setPersonalNote] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [vibe, setVibe] = useState('romantic');
  const [budget, setBudget] = useState(100);
  const [freeText, setFreeText] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function budgetToBucket(val: number): string {
    if (val < 30) return 'under-30';
    if (val <= 60) return '30-60';
    if (val <= 100) return '60-100';
    return 'no-limit';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!recipientName.trim()) { setErr('Who is this date for?'); return; }
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) { setErr('We need their email to deliver the plan.'); return; }

    track('wingman_started', { occasion, vibe, budget });

    if (!user) {
      openAuth('signup');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/wingman/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim().toLowerCase(),
          occasion,
          personalNote: personalNote.trim(),
          neighborhood,
          vibe,
          budget: budgetToBucket(budget),
          freeText: freeText.trim(),
          deliveryDate: deliveryDate || null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.giftId) {
        // Free path (for Pro users) — plan was created directly
        router.push(`/wingman/sent?id=${data.giftId}`);
        return;
      }
      throw new Error(data.message || 'Something went wrong.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container plan-page">
      <div className="plan-header">
        <div className="wingman-badge">Wingman Mode</div>
        <h1>Plan a date for someone else</h1>
        <p className="plan-sub">
          Be the hero. Build a surprise date night for a friend, partner, or couple you love.
          We&apos;ll deliver a fully choreographed plan to their inbox — where to go, when to arrive, what to order.
        </p>
        <div className="wingman-price">$7.99 one-time · no subscription needed</div>
      </div>

      <form onSubmit={submit} className="plan-form">
        {/* Recipient info */}
        <div className="plan-field">
          <span className="plan-label">Who is this date for?</span>
          <input
            type="text"
            className="plan-input"
            placeholder="Their name (e.g. Sarah & Mike)"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        <div className="plan-field">
          <span className="plan-label">Their email (we&apos;ll deliver the plan here)</span>
          <input
            type="email" aria-label="Email address"
            className="plan-input"
            placeholder="friend@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>

        {/* Occasion */}
        <div className="plan-field">
          <span className="plan-label">What&apos;s the occasion?</span>
          <div className="plan-chips">
            {OCCASIONS.map((o) => (
              <Chip key={o.id} active={occasion === o.id} onClick={() => setOccasion(o.id)}>{o.label}</Chip>
            ))}
          </div>
        </div>

        {/* Personal note */}
        <label className="plan-field plan-field-optional">
          <span className="plan-label">Personal note <span className="plan-optional-tag">optional</span></span>
          <textarea
            className="plan-textarea"
            placeholder="Happy birthday! You two deserve an amazing night out. — Jake"
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            rows={2}
          />
        </label>

        {/* Delivery date */}
        <div className="plan-field">
          <span className="plan-label">When should we deliver it? <span className="plan-optional-tag">optional</span></span>
          <input
            type="date"
            className="plan-input"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <span className="plan-hint">Leave blank to send immediately after purchase</span>
        </div>

        <hr className="plan-divider" />

        <p className="wingman-section-label">Now tell us about them so we can build the perfect night:</p>

        {/* Neighborhood */}
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

        {/* Vibe */}
        <div className="plan-field">
          <span className="plan-label">What vibe suits them?</span>
          <div className="plan-chips">
            {VIBES.map((v) => (
              <Chip key={v.id} active={vibe === v.id} onClick={() => setVibe(v.id)}>{v.label}</Chip>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="plan-field">
          <span className="plan-label">Budget for their night: <strong>${budget}</strong></span>
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
            <span>$20</span><span>$100</span><span>$200</span><span>$300+</span>
          </div>
        </div>

        {/* Extra context */}
        <label className="plan-field plan-field-optional">
          <span className="plan-label">What do you know about them? <span className="plan-optional-tag">optional</span></span>
          <textarea
            className="plan-textarea"
            placeholder="She loves Thai food. He's vegetarian. They like artsy spots with good cocktails. Nothing too loud."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
          />
        </label>

        {err && <div className="auth-err">{err}</div>}
        <button type="submit" className="cta plan-submit" disabled={busy}>
          {busy ? 'Setting it up…' : 'Plan their date — $7.99'}
        </button>
      </form>
    </div>
  );
}
