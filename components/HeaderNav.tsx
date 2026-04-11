'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function HeaderNav() {
  const { user, profile, openAuth, signOut, isPremium } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  /* Close menu on route change */
  useEffect(() => { setOpen(false); }, [pathname]);

  /* Lock body scroll when menu is open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <nav className="nav" aria-label="Primary">
      {/* Desktop links (hidden on mobile via CSS) */}
      <div className="nav-desktop">
        <Link href="/discovery">All Spots</Link>
        <Link href="/plan-my-date" className="nav-plan">Plan My Date ✦</Link>
        <Link href="/couples">Couples</Link>
        <Link href="/premium">Premium</Link>
        {user ? (
          <div className="nav-user">
            <span className="nav-tier">{isPremium ? '★ Premium' : 'Free'}</span>
            <button className="nav-link-btn" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <button className="nav-link-btn" onClick={() => openAuth('signin')}>Sign in</button>
        )}
      </div>

      {/* Mobile hamburger + overlay */}
      <button
        className="nav-hamburger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Toggle navigation menu"
      >
        <span className={`hamburger-line${open ? ' open-top' : ''}`} />
        <span className={`hamburger-line${open ? ' open-mid' : ''}`} />
        <span className={`hamburger-line${open ? ' open-bot' : ''}`} />
      </button>

      {open && (
        <div className="nav-mobile-overlay" onClick={() => setOpen(false)}>
          <div className="nav-mobile-menu" onClick={(e) => e.stopPropagation()}>
            <Link href="/discovery" onClick={() => setOpen(false)}>All Spots</Link>
            <Link href="/plan-my-date" onClick={() => setOpen(false)}>Plan My Date ✦</Link>
            <Link href="/couples" onClick={() => setOpen(false)}>Couples</Link>
            <Link href="/premium" onClick={() => setOpen(false)}>Premium</Link>
            {user ? (
              <>
                <span className="nav-tier">{isPremium ? '★ Premium' : 'Free'}</span>
                <button className="nav-link-btn" onClick={() => { signOut(); setOpen(false); }}>Sign out</button>
              </>
            ) : (
              <button className="nav-link-btn" onClick={() => { openAuth('signin'); setOpen(false); }}>Sign in</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
