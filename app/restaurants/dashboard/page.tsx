'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase-browser';
import { track } from '@/components/PostHogProvider';

type Restaurant = {
  id: string;
  venue_slug: string;
  display_name: string;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  hero_photo: string | null;
  description: string | null;
  tags: string[];
  date_packages: any[];
  tier: string;
  views_count: number;
  clicks_count: number;
  saves_count: number;
  verified: boolean;
};

const TAG_OPTIONS = [
  'Romantic', 'Casual', 'Upscale', 'Cozy', 'Trendy', 'Low-Key',
  'Great for First Dates', 'Outdoor Seating', 'Live Music', 'Late Night',
];

export default function RestaurantDashboard() {
  const { user, profile, loading, openAuth } = useAuth();
  const supabase = createClient();
  const [list, setList] = useState<Restaurant[]>([]);
  const [active, setActive] = useState<Restaurant | null>(null);
  const [busy, setBusy] = useState(false);
  const [claimSlug, setClaimSlug] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .then(({ data }) => {
        if (data) {
          setList(data as Restaurant[]);
          if (data.length && !active) setActive(data[0] as Restaurant);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div className="container"><p>Loading…</p></div>;
  if (!user) {
    return (
      <div className="container">
        <div className="dashboard-empty">
          <h1>Restaurant Dashboard</h1>
          <p>Sign in or create a restaurant account to claim your listing.</p>
          <button className="cta" onClick={() => openAuth('signup', 'restaurant', 'restaurant')}>Get started</button>
        </div>
      </div>
    );
  }
  if (profile && profile.role !== 'restaurant') {
    return (
      <div className="container">
        <div className="dashboard-empty">
          <h1>This is the restaurant dashboard.</h1>
          <p>Your account is set up as a dater. If you own a restaurant, sign out and create a separate restaurant account.</p>
          <Link href="/" className="cta cta-secondary">Back to home</Link>
        </div>
      </div>
    );
  }

  async function claim() {
    if (!claimSlug.trim() || !user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: user.id,
        venue_slug: claimSlug.trim(),
        display_name: claimSlug.trim().replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        tags: [],
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    if (data) {
      setList([...list, data as Restaurant]);
      setActive(data as Restaurant);
      setClaimSlug('');
      track('restaurant_claimed', { venue_slug: claimSlug });
    }
  }

  async function save() {
    if (!active) return;
    setBusy(true);
    const { error } = await supabase
      .from('restaurants')
      .update({
        display_name: active.display_name,
        contact_email: active.contact_email,
        phone: active.phone,
        website: active.website,
        hero_photo: active.hero_photo,
        description: active.description,
        tags: active.tags,
        date_packages: active.date_packages,
      })
      .eq('id', active.id);
    setBusy(false);
    if (error) alert(error.message);
    else track('restaurant_listing_updated', { id: active.id });
  }

  function toggleTag(tag: string) {
    if (!active) return;
    const set = new Set(active.tags);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    setActive({ ...active, tags: Array.from(set) });
  }

  return (
    <div className="container dashboard">
      <div className="dashboard-head">
        <h1>Restaurant Dashboard</h1>
        <p>Welcome back. Here&apos;s how your listing is performing.</p>
      </div>

      {list.length === 0 && (
        <div className="dashboard-claim">
          <h2>Claim your first listing</h2>
          <p>Enter the venue slug from your DatingDex listing URL (e.g. <code>cafe-milano</code> from <code>datingdex.com/venue/cafe-milano</code>).</p>
          <div className="dashboard-claim-row">
            <input
              type="text"
              placeholder="venue-slug"
              value={claimSlug}
              onChange={(e) => setClaimSlug(e.target.value)}
              className="plan-input"
            />
            <button className="cta" disabled={busy || !claimSlug} onClick={claim}>
              {busy ? 'Claiming…' : 'Claim listing'}
            </button>
          </div>
          <p className="pmd-fineprint">We&apos;ll verify ownership before your changes go live.</p>
        </div>
      )}

      {active && (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat"><div className="num">{active.views_count}</div><div className="lbl">Views</div></div>
            <div className="dashboard-stat"><div className="num">{active.clicks_count}</div><div className="lbl">Clicks</div></div>
            <div className="dashboard-stat"><div className="num">{active.saves_count}</div><div className="lbl">Saves</div></div>
            <div className="dashboard-stat"><div className="num">{active.tier}</div><div className="lbl">Plan</div></div>
          </div>

          <div className="dashboard-section">
            <h2>Listing details</h2>
            <label>Display name<input type="text" value={active.display_name} onChange={(e) => setActive({ ...active, display_name: e.target.value })} /></label>
            <label>Description<textarea rows={4} value={active.description ?? ''} onChange={(e) => setActive({ ...active, description: e.target.value })} /></label>
            <label>Hero photo URL<input type="url" value={active.hero_photo ?? ''} onChange={(e) => setActive({ ...active, hero_photo: e.target.value })} /></label>
            <label>Website<input type="url" value={active.website ?? ''} onChange={(e) => setActive({ ...active, website: e.target.value })} /></label>
            <label>Phone<input type="tel" value={active.phone ?? ''} onChange={(e) => setActive({ ...active, phone: e.target.value })} /></label>
            <label>Contact email<input type="email" aria-label="Email address" value={active.contact_email ?? ''} onChange={(e) => setActive({ ...active, contact_email: e.target.value })} /></label>

            <div className="dashboard-tags">
              <span className="plan-label">Tags</span>
              <div className="plan-chips">
                {TAG_OPTIONS.map((t) => (
                  <button key={t} type="button" className={`plan-chip${active.tags.includes(t) ? ' active' : ''}`} onClick={() => toggleTag(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button className="cta" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          </div>

          <div className="dashboard-section">
            <h2>Upgrade for boosted Plan My Date placement</h2>
            <p>Featured ($99/mo) and Premium ($249/mo) restaurants get a real algorithmic boost in Plan My Date results — the moment a diner is choosing where to book.</p>
            <Link href="/for-restaurants/pricing" className="cta">See plans →</Link>
          </div>
        </>
      )}
    </div>
  );
}
