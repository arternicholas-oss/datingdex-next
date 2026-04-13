'use client';

import { useState } from 'react';

export default function AppWaitlist() {
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
        body: JSON.stringify({ email, source: 'app-waitlist' }),
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
          <h2>Get the DatingDex app.</h2>
          <p>
            Couples Mode, memory between dates, post-date debriefs, and push
            reminders — everything the web tool can&apos;t do. iOS + Android,
            launching spring 2026.
          </p>
        </div>
        {state === 'done' ? (
          <p className="email-done">You&apos;re on the list. We&apos;ll email you the day it drops. ✦</p>
        ) : (
          <form onSubmit={submit}>
            <input
              type="email"
              name="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === 'loading'}
              aria-label="Email address for app waitlist"
            />
            <button type="submit" className="cta cta-primary" disabled={state === 'loading'}>
              {state === 'loading' ? 'Joining…' : 'Join the waitlist →'}
            </button>
            {state === 'error' && <p className="email-error">Something went wrong. Try again?</p>}
          </form>
        )}
      </div>
    </div>
  );
}
