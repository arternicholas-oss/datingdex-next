'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

export default function AuthModal() {
  const { authOpen, closeAuth, openAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'restaurant'>('user');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!authOpen) return null;
  const mode = authOpen;
  const supabase = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, role } },
        });
        if (error) throw error;
        setInfo('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        closeAuth();
      }
    } catch (e: any) {
      setErr(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" onClick={closeAuth} aria-label="Close">×</button>
        <h2 id="auth-title" className="modal-title">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="modal-sub">
          {mode === 'signup'
            ? 'Save your date plans, get a post-date debrief email, and unlock smarter recommendations over time.'
            : 'Sign in to keep your saved plans and preferences.'}
        </p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <>
              <div className="auth-role-picker">
                <button type="button" className={role === 'user' ? 'active' : ''} onClick={() => setRole('user')}>
                  I&apos;m planning a date
                </button>
                <button type="button" className={role === 'restaurant' ? 'active' : ''} onClick={() => setRole('restaurant')}>
                  I own a restaurant
                </button>
              </div>
              <label>
                {role === 'restaurant' ? 'Restaurant name' : 'Your name'}
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
          {err && <div className="auth-err">{err}</div>}
          {info && <div className="auth-info">{info}</div>}
          <button type="submit" className="cta" disabled={busy}>
            {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'signup' ? (
            <>Already have an account? <button onClick={() => openAuth('signin')}>Sign in</button></>
          ) : (
            <>New here? <button onClick={() => openAuth('signup')}>Create account</button></>
          )}
        </div>
      </div>
    </div>
  );
}
