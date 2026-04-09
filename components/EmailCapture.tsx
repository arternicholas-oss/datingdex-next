'use client';

import { useState } from 'react';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source: 'home' }),
      });
      if (!res.ok) throw new Error();
      setState('done');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="email-capture">
      <div className="email-capture-inner">
        <div>
          <h2>Get 5 new DC date spots every Friday.</h2>
          <p>One email a week. Vetted, ranked, never sponsored. Unsubscribe in one click.</p>
        </div>
        {state === 'done' ? (
          <p className="email-done">Check your inbox — you're in. ✦</p>
        ) : (
          <form onSubmit={submit}>
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === 'loading'}
            />
            <button type="submit" className="cta cta-primary" disabled={state === 'loading'}>
              {state === 'loading' ? 'Signing up…' : 'Send me the list →'}
            </button>
            {state === 'error' && <p className="email-error">Something went wrong. Try again?</p>}
          </form>
        )}
      </div>
    </div>
  );
}
