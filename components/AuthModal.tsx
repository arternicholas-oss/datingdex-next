'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

const SUBTITLE: Record<string, { signup: string; signin: string }> = {
  default: {
    signup: 'Save your date plans, get a post-date debrief email, and unlock smarter recommendations over time.',
    signin: 'Sign in to keep your saved plans and preferences.',
  },
  restaurant: {
    signup: 'Create a restaurant account to claim your listing, manage your profile, and reach daters in DC.',
    signin: 'Sign in to manage your restaurant listing and view analytics.',
  },
  couples: {
    signup: 'Create an account to start your shared date brain — save spots together, vote on plans, and get anniversary reminders.',
    signin: 'Sign in to get back to your shared Couples space.',
  },
};

export default function AuthModal() {
  const { authOpen, closeAuth, openAuth, authDefaultRole, authContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'restaurant'>('user');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset role to the default whenever the modal opens
  useEffect(() => {
    if (authOpen) {
      setRole(authDefaultRole);
      setErr(null);
      setInfo(null);
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [authOpen, authDefaultRole]);

  // Escape key closes modal
  useEffect(() => {
    if (!authOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAuth();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [authOpen, closeAuth]);

  // Focus trap: keep Tab within modal
  useEffect(() => {
    if (!authOpen || !modalRef.current) return;
    const modal = modalRef.current;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) (focusable[0] as HTMLElement).focus();

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [authOpen]);

  if (!authOpen) return null;
  const mode = authOpen;
  const supabase = createClient();
  const ctx = authContext || 'default';
  const sub = SUBTITLE[ctx] || SUBTITLE.default;

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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" ref={modalRef}>
        <button className="modal-close" onClick={closeAuth} aria-label="Close">×</button>
        <h2 id="auth-title" className="modal-title">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="modal-sub">
          {mode === 'signup' ? sub.signup : sub.signin}
        </p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <>
              <div className="auth-role-picker">
                <button
                  type="button"
                  className={role === 'user' ? 'active' : ''}
                  onClick={() => setRole('user')}
                  aria-pressed={role === 'user'}
                >
                  I&apos;m planning a date
                </button>
                <button
                  type="button"
                  className={role === 'restaurant' ? 'active' : ''}
                  onClick={() => setRole('restaurant')}
                  aria-pressed={role === 'restaurant'}
                >
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
            <>Already have an account? <button onClick={() => openAuth('signin', authDefaultRole, authContext)}>Sign in</button></>
          ) : (
            <>New here? <button onClick={() => openAuth('signup', authDefaultRole, authContext)}>Create account</button></>
          )}
        </div>
      </div>
    </div>
  );
}
