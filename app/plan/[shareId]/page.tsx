import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = { params: { shareId: string } };

async function getPlan(shareId: string) {
  const svc = createServiceClient();
  const { data } = await svc
    .from('plans')
    .select('id, share_id, city, situation, vibe, activity, budget, itinerary, share_blurb, is_public, created_at')
    .eq('share_id', shareId)
    .single();
  if (!data || !data.is_public) return null;
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const plan = await getPlan(params.shareId);
  if (!plan) return { title: 'Plan not found' };
  const it: any = plan.itinerary;
  const stops = it?.stops || [];
  const title = stops.map((s: any) => s.venue?.name).filter(Boolean).join(' → ');
  const desc = plan.share_blurb || `A complete date night plan in ${plan.city}.`;
  const ogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.datingdex.com'}/api/og/plan/${params.shareId}`;
  return {
    title: `${title} — Date Night Plan`,
    description: desc,
    openGraph: {
      title: `${title} — Date Night Plan`,
      description: desc,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — Date Night Plan`,
      description: desc,
      images: [ogUrl],
    },
    alternates: { canonical: `https://www.datingdex.com/plan/${params.shareId}` },
  };
}

export default async function SavedPlanPage({ params }: Params) {
  const plan = await getPlan(params.shareId);
  if (!plan) notFound();
  const it: any = plan.itinerary;
  const stops = it.stops || [];

  return (
    <div className="container plan-saved">
      <div className="plan-saved-head">
        <div className="plan-saved-eyebrow">A DatingDex date plan ✦</div>
        <h1>{stops.map((s: any) => s.venue?.name).filter(Boolean).join(' → ')}</h1>
        <p className="plan-saved-sub">{plan.share_blurb}</p>
        <p className="plan-saved-meta">
          {plan.city} · Estimated total ${it.totalEstimateUsd?.[0] ?? '—'}–${it.totalEstimateUsd?.[1] ?? '—'} for two · {it.walkingMinutes ?? 0} min walking
        </p>
      </div>

      {stops.map((s: any, i: number) => (
        <article key={i} className="plan-stop">
          <div className="plan-stop-time">
            <div className="plan-stop-slot">{s.slot === 'main' ? 'Main' : s.slot === 'before' ? 'Before' : 'After'}</div>
            <div className="plan-stop-clock">{s.startTime}</div>
            <div className="plan-stop-dur">{s.durationMin} min</div>
          </div>
          <div className="plan-stop-body">
            <h3>{s.venue?.name}</h3>
            <div className="plan-stop-meta">{s.venue?.neighborhood} · {s.venue?.price} · {s.venue?.vibe}</div>
            <p className="plan-stop-blurb">{s.blurb}</p>
            <a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="plan-book-btn">
              {s.bookingProvider === 'resy' ? 'Book on Resy →' : s.bookingProvider === 'opentable' ? 'Book on OpenTable →' : 'Get directions →'}
            </a>
          </div>
        </article>
      ))}

      <div className="plan-saved-cta">
        <p>Want a plan like this for your next date?</p>
        <Link href="/plan" className="cta">Build my own ✦</Link>
      </div>
    </div>
  );
}
