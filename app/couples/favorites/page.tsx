'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient as createBrowserClient } from '@/lib/supabase-browser';
import { VENUES } from '@/lib/venues';

export default function CouplesFavoritesPage() {
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [favs, setFavs] = useState<{ venue_slug: string; saved_by: string; note: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    const supa = createBrowserClient();
    (async () => {
      const { data: couple } = await supa.from('couples').select('id')
        .or(`partner_a.eq.${user.id},partner_b.eq.${user.id}`).eq('status', 'active').limit(1).maybeSingle();
      if (!couple) return;
      setCoupleId(couple.id);
      const { data: f } = await supa.from('couple_favorites').select('*').eq('couple_id', couple.id);
      setFavs((f as any) || []);
    })();
  }, [user]);

  if (!user) return <section className="container" style={{ padding: '3rem 1.25rem' }}><p>Sign in to view your shared favorites.</p></section>;
  if (!coupleId) return <section className="container" style={{ padding: '3rem 1.25rem' }}><p>You don't have an active Couples space yet. <Link href="/couples">Create one →</Link></p></section>;

  const venues = favs.map(f => VENUES.find(v => v.slug === f.venue_slug)).filter(Boolean);

  return (
    <section className="container" style={{ padding: '3rem 1.25rem' }}>
      <h1>Shared favorites</h1>
      <p className="section-sub">Everything you've both saved, in one place.</p>
      {venues.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No saved spots yet. <Link href="/discovery">Browse spots →</Link></p>
      ) : (
        <div className="spots-grid">
          {venues.map((v: any) => (
            <Link key={v.slug} href={`/venue/${v.slug}`} className="vibe-card">
              <h3>{v.name}</h3>
              <p>{v.neighborhood} · {v.vibe}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
