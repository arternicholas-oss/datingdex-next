'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient as createBrowserClient } from '@/lib/supabase-browser';
import { VENUES } from '@/lib/venues';

export default function CouplesVotePage() {
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no'>>({});
  const [overlap, setOverlap] = useState<string[] | null>(null);

  const shortlist = useMemo(() => {
    return [...VENUES].filter(v => (v.score ?? 0) >= 9.3).sort(() => Math.random() - 0.5).slice(0, 5);
  }, []);

  useEffect(() => {
    if (!user) return;
    const supa = createBrowserClient();
    supa.from('couples').select('id')
      .or(`partner_a.eq.${user.id},partner_b.eq.${user.id}`).eq('status', 'active').limit(1).maybeSingle()
      .then(({ data }) => { if (data) setCoupleId(data.id); });
  }, [user]);

  async function cast(vote: 'yes' | 'no') {
    if (!coupleId || !user) return;
    const venue = shortlist[idx];
    setVotes({ ...votes, [venue.slug]: vote });
    const supa = createBrowserClient();
    await supa.from('couple_votes').upsert({ couple_id: coupleId, user_id: user.id, venue_slug: venue.slug, vote });
    if (idx + 1 < shortlist.length) {
      setIdx(idx + 1);
    } else {
      // find overlap with partner
      const { data } = await supa.from('couple_votes').select('venue_slug, user_id, vote').eq('couple_id', coupleId).eq('vote', 'yes');
      const byVenue: Record<string, Set<string>> = {};
      (data || []).forEach((r: any) => { (byVenue[r.venue_slug] ||= new Set()).add(r.user_id); });
      const winners = Object.entries(byVenue).filter(([, s]) => s.size >= 2).map(([k]) => k);
      setOverlap(winners);
    }
  }

  if (!user) return <section className="container" style={{ padding: '3rem 1.25rem' }}><p>Sign in to vote.</p></section>;
  if (!coupleId) return <section className="container" style={{ padding: '3rem 1.25rem' }}><p>No active Couples space yet.</p></section>;

  if (overlap) {
    const winners = overlap.map(s => VENUES.find(v => v.slug === s)).filter(Boolean);
    return (
      <section className="container" style={{ padding: '3rem 1.25rem', maxWidth: 720 }}>
        <h1>Your overlap</h1>
        {winners.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No overlap yet. Wait for your partner to vote, then check back.</p>
        ) : (
          <ul>{winners.map((v: any) => <li key={v.slug} style={{ fontSize: '1.2rem', margin: '.5rem 0' }}>{v.name} — {v.neighborhood}</li>)}</ul>
        )}
      </section>
    );
  }

  const v = shortlist[idx];
  return (
    <section className="container" style={{ padding: '3rem 1.25rem', maxWidth: 560, textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>{idx + 1} of {shortlist.length}</p>
      <h1 style={{ fontSize: '2rem', margin: '1rem 0 .5rem' }}>{v.name}</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>{v.neighborhood} · {v.vibe} · {v.price}</p>
      <p style={{ fontSize: '1.05rem', marginBottom: '2rem' }}>{v.hook}</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="cta cta-ghost" onClick={() => cast('no')}>Pass</button>
        <button className="cta cta-primary" onClick={() => cast('yes')}>Yes →</button>
      </div>
    </section>
  );
}
