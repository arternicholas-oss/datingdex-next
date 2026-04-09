'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function HeaderNav() {
  const { user, profile, openAuth, signOut, isPremium } = useAuth();

  return (
    <nav className="nav" aria-label="Primary">
      <Link href="/discovery">All Spots</Link>
      <Link href="/plan-my-date" className="nav-plan">Plan My Date ✦</Link>
      <Link href="/premium">Premium</Link>
      {user ? (
        <div className="nav-user">
          <span className="nav-tier">{isPremium ? '★ Premium' : 'Free'}</span>
          <button className="nav-link-btn" onClick={signOut}>Sign out</button>
        </div>
      ) : (
        <button className="nav-link-btn" onClick={() => openAuth('signin')}>Sign in</button>
      )}
    </nav>
  );
}
