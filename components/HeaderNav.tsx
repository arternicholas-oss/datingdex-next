'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function HeaderNav() {
  const { user, profile, openAuth, signOut, isPremium } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav" aria-label="Primary">
      <button
        className="nav-hamburger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="nav-links"
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
      <div id="nav-links" className={`nav-links${open ? ' nav-open' : ''}`}>
        <Link href="/discovery" onClick={() => setOpen(false)}>All Spots</Link>
        <Link href="/plan-my-date" className="nav-plan" onClick={() => setOpen(false)}>Plan My Date ✦</Link>
        <Link href="/couples" onClick={() => setOpen(false)}>Couples</Link>
        <Link href="/premium" onClick={() => setOpen(false)}>Premium</Link>
        {user ? (
          <div className="nav-user">
            <span className="nav-tier">{isPremium ? '★ Premium' : 'Free'}</span>
            <button className="nav-link-btn" onClick={() => { signOut(); setOpen(false); }}>Sign out</button>
          </div>
        ) : (
          <button className="nav-link-btn" onClick={() => { openAuth('signin'); setOpen(false); }}>Sign in</button>
        )}
      </div>
    </nav>
  );
}
