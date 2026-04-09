'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient as createBrowserClient } from '@/lib/supabase-browser';

type Couple = {
  id: string;
  partner_a: string;
  partner_b: string | null;
  invite_token: string | null;
  anniversary_date: string | null;
  display_name: string | null;
  status: string;
};

export default function CouplesPage() {
  const { user, openAuth } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const supa = createBrowserClient();
    supa.from('couples')
      .select('*')
      .or(`partner_a.eq.${user.id},partner_b.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { setCouple(data as Couple | null); setLoading(false); });
  }, [user]);

  async function createCouple() {
    setCreating(true);
    const res = await fetch('/api/couples/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
    const json = await res.json();
    if (json.couple) setCouple(json.couple);
    setCreating(false);
  }

  if (!user) {
    return (
      <>
        <section className="hero hero-v2">
          <div className="container">
            <div className="hero-badge">✦ New · Couples Mode</div>
            <h1>Stop arguing about where to eat.</h1>
            <p className="hero-sub">
              Save spots together. Vote on tonight's plan. Get anniversary reminders.
              The shared date brain for you and your person.
            </p>
            <div className="hero-ctas">
              <button className="cta cta-primary" onClick={() => openAuth('signup')}>Sign up free →</button>
              <Link href="/plan-my-date" className="cta cta-ghost">Or plan a date solo</Link>
            </div>
          </div>
        </section>
        <section className="container">
          <div className="how-grid">
            <div className="how-step"><div className="how-num">1</div><h3>Invite your partner</h3><p>Share a private link. One tap, no passwords to share.</p></div>
            <div className="how-step"><div className="how-num">2</div><h3>Save spots together</h3><p>Both partners save favorites to a shared list, with notes.</p></div>
            <div className="how-step"><div className="how-num">3</div><h3>Vote on tonight</h3><p>We shortlist 5 spots. You both swipe. Overlap wins — and we book it.</p></div>
          </div>
        </section>
      </>
    );
  }

  if (loading) return <section className="container" style={{ padding: '3rem 1.25rem' }}><p>Loading…</p></section>;

  if (!couple) {
    return (
      <section className="container" style={{ padding: '3rem 1.25rem', maxWidth: 720 }}>
        <div className="hero-badge">✦ New · Couples Mode</div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', margin: '1rem 0' }}>Start your shared date brain</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          One tap to create a Couples space. You'll get an invite link to send your partner.
        </p>
        <button className="cta cta-primary" onClick={createCouple} disabled={creating}>
          {creating ? 'Creating…' : 'Create Couples space →'}
        </button>
      </section>
    );
  }

  const inviteUrl = couple.invite_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/couples/join/${couple.invite_token}`
    : null;

  return (
    <section className="container" style={{ padding: '3rem 1.25rem', maxWidth: 820 }}>
      <h1>Your Couples space</h1>
      {couple.status === 'pending' && inviteUrl && (
        <div className="couples-card" style={{ marginTop: '1.5rem' }}>
          <div style={{ width: '100%' }}>
            <h2>Waiting for your partner</h2>
            <p>Send this private link to your person. The moment they sign in and tap it, you're linked.</p>
            <input
              readOnly
              value={inviteUrl}
              style={{ width: '100%', padding: '.95rem 1.15rem', border: '1px solid #ffd6cc', borderRadius: 999, fontSize: '.95rem', background: '#fff' }}
              onFocus={(e) => e.currentTarget.select()}
            />
            <p style={{ marginTop: '.75rem' }}>
              <button className="cta cta-primary" onClick={() => { navigator.clipboard.writeText(inviteUrl); }}>Copy link</button>
            </p>
          </div>
        </div>
      )}
      {couple.status === 'active' && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--muted)' }}>
            You're linked. Saved spots, votes, and anniversary reminders live here.
          </p>
          <div className="how-grid" style={{ marginTop: '2rem' }}>
            <Link href="/couples/favorites" className="how-step"><div className="how-num">♥</div><h3>Shared favorites</h3><p>Spots you've both saved.</p></Link>
            <Link href="/couples/vote" className="how-step"><div className="how-num">✓</div><h3>Vote on tonight</h3><p>Swipe yes/no on 5 picks.</p></Link>
            <Link href="/couples/settings" className="how-step"><div className="how-num">⚙</div><h3>Anniversary & settings</h3><p>Set your date, get reminders.</p></Link>
          </div>
        </div>
      )}
    </section>
  );
}
