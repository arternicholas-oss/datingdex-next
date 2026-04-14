import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Dates \u2014 Saved plans',
  description: 'Every plan you\u2019ve built, with the option to debrief and feed your next plan smarter.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.datingdex.com/my-dates' },
};

export default async function MyDatesPage() {
  const supabase = createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) redirect('/?auth=signin&redirect=%2Fmy-dates');

  const svc = createServiceClient();
  const { data: plans } = await svc
    .from('plans')
    .select('id, share_id, city, situation, vibe, budget, itinerary, plan_payload, date_at, created_at, debrief_response')
    .eq('user_id', userRes.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = plans || [];

  return (
    <div className="container my-dates">
      <div className="my-dates-head">
        <h1>My Dates</h1>
        <p>{rows.length === 0 ? 'No plans yet. Start your first one.' : `${rows.length} plan${rows.length === 1 ? '' : 's'} saved.`}</p>
      </div>

      {rows.length === 0 ? (
        <div className="my-dates-empty">
          <Link href="/plan-my-date" className="cta">Plan my first date \u2726</Link>
        </div>
      ) : (
        <div className="my-dates-grid">
          {rows.map((p: any) => {
            const it = p.itinerary || {};
            const stops = it.stops || [];
            const payload = p.plan_payload || {};
            const title = stops.map((s: any) => s.venue?.name).filter(Boolean).join(' \u2192 ');
            const when = p.date_at
              ? new Date(p.date_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
              : new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const debriefDone = !!p.debrief_response;
            return (
              <Link key={p.id} href={`/plan/${p.share_id}`} className="my-dates-card">
                <div className="my-dates-when">{when}</div>
                <div className="my-dates-title">{title || 'Untitled plan'}</div>
                <div className="my-dates-meta">{p.city} \u00b7 {p.vibe || 'date night'} \u00b7 ${it.totalEstimateUsd?.[0] ?? '?'}\u2013${it.totalEstimateUsd?.[1] ?? '?'}</div>
                {payload.coldOpen && <div className="my-dates-line">\u201c{String(payload.coldOpen).slice(0, 120)}\u201d</div>}
                <div className="my-dates-tags">
                  {debriefDone ? <span className="tag tag-good">Debriefed</span> : <span className="tag tag-pending">Debrief pending</span>}
                  <span className="tag">{stops.length} stop{stops.length === 1 ? '' : 's'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/plan-my-date" className="cta">Build a new plan \u2726</Link>
      </div>
    </div>
  );
}
