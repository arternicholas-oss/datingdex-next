'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function CouplesJoinPage({ params }: { params: { token: string } }) {
  const { user, openAuth, loading: authLoading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'joining' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { openAuth('signup'); return; }
    if (state !== 'idle') return;
    setState('joining');
    fetch('/api/couples/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: params.token }),
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) { setError(json.error || 'Could not join'); setState('error'); return; }
        setState('done');
        setTimeout(() => router.push('/couples'), 1200);
      })
      .catch(() => { setError('Network error'); setState('error'); });
  }, [user, authLoading, params.token, state, openAuth, router]);

  return (
    <section className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center', maxWidth: 560 }}>
      <div className="hero-badge">✦ Couples Mode</div>
      <h1 style={{ marginTop: '1rem' }}>Joining your partner…</h1>
      {state === 'joining' && <p style={{ color: 'var(--muted)' }}>One second.</p>}
      {state === 'done' && <p style={{ color: '#22c55e', fontWeight: 600 }}>You're linked. Redirecting…</p>}
      {state === 'error' && <p style={{ color: '#ff6b6b' }}>{error}</p>}
      {!user && !authLoading && <p style={{ color: 'var(--muted)' }}>Sign in to join.</p>}
    </section>
  );
}
