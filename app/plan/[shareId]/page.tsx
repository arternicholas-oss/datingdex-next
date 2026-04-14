import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase-server';
import { formatTime12h, glance12h, dedupeLeadingSentence } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = { params: { shareId: string } };

async function getPlan(shareId: string) {
  const svc = createServiceClient();
  const { data } = await svc
    .from('plans')
    .select('id, share_id, city, city_slug, situation, vibe, activity, budget, itinerary, plan_payload, share_blurb, is_public, created_at, weather, playlist_url')
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
  const stops: any[] = it?.stops || [];
  const p: any = plan.plan_payload || {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.datingdex.com';
  const ogImageUrl = `${siteUrl}/api/og/plan/${params.shareId}`;

  return (
    <div className="container plan-saved plan-result-v3">
      <div className="plan-saved-head">
        <div className="plan-saved-eyebrow">A DatingDex date plan ✦</div>
        <h1>{stops.map((s: any) => s.venue?.name).filter(Boolean).join(' → ')}</h1>

        {p.coldOpen && <div className="plan-cold-open">“{p.coldOpen}”</div>}
        {p.nightAtAGlance && <div className="plan-glance">{glance12h(p.nightAtAGlance)}</div>}
        {!p.coldOpen && plan.share_blurb && <p className="plan-saved-sub">{plan.share_blurb}</p>}

        <p className="plan-saved-meta">
          {plan.city} · Estimated total ${it.totalEstimateUsd?.[0] ?? '—'}–${it.totalEstimateUsd?.[1] ?? '—'} for two · {it.walkingMinutes ?? 0} min walking
        </p>
      </div>

      {/* Share card preview */}
      <div className="plan-share-card">
        <img
          src={ogImageUrl}
          alt="Share card preview"
          width={1200}
          height={630}
          style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1.5px solid #eee' }}
        />
        <div className="plan-share-actions">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`My date night plan: ${stops.map((s: any) => s.venue?.name).join(' → ')} ✦`)}&url=${encodeURIComponent(`${siteUrl}/plan/${params.shareId}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cta cta-secondary plan-share-btn"
          >
            Share on X →
          </a>
          <a
            href={`/api/plan/${params.shareId}/ics`}
            className="cta cta-secondary plan-share-btn"
          >
            Add to calendar
          </a>
          <a
            href={`/api/plan/${params.shareId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="cta cta-secondary plan-share-btn"
          >
            Download PDF
          </a>
        </div>
      </div>

      {/* Timing / weather / playlist strip */}
      {p.timingSheet && (
        <div className="plan-strip">
          <div className="plan-strip-col">
            <div className="plan-strip-label">Leave by</div>
            <div className="plan-strip-value">{formatTime12h(p.timingSheet.leaveBy)}</div>
            <div className="plan-strip-sub">Ride ~{p.timingSheet.rideEstimateMin}min · ET</div>
          </div>
          <div className="plan-strip-col">
            <div className="plan-strip-label">Arrive</div>
            <div className="plan-strip-value">{formatTime12h(p.timingSheet.arriveBy)}</div>
            <div className="plan-strip-sub">Table holds {p.timingSheet.reservationHoldMin}min</div>
          </div>
          {p.weather && (
            <div className="plan-strip-col">
              <div className="plan-strip-label">Weather</div>
              <div className="plan-strip-value">{p.weather.tempF}°F</div>
              <div className="plan-strip-sub">{p.weather.note}</div>
            </div>
          )}
          {p.playlist && (
            <div className="plan-strip-col">
              <div className="plan-strip-label">Pre-date playlist</div>
              <a href={p.playlist.url} target="_blank" rel="noopener noreferrer" className="plan-strip-link">
                {p.playlist.name} →
              </a>
              <div className="plan-strip-sub">{p.playlist.note}</div>
            </div>
          )}
        </div>
      )}

      {stops.map((s: any, i: number) => (
        <article key={i} className="plan-stop-v3">
          <div className="plan-stop-header">
            <div className="plan-stop-time">
              <div className="plan-stop-slot">{s.slot === 'main' ? 'Main' : s.slot === 'before' ? 'Drinks' : s.slot === 'activity' ? 'Activity' : 'After'}</div>
              <div className="plan-stop-clock">{formatTime12h(s.startTime)}</div>
              <div className="plan-stop-dur">{s.durationMin} min</div>
            </div>
            <div className="plan-stop-title">
              <h3>{s.venue?.name}</h3>
              <div className="plan-stop-meta">{s.venue?.neighborhood} · {s.venue?.price}</div>
            </div>
          </div>
          {s.blurb && <p className="plan-stop-blurb">{dedupeLeadingSentence(s.blurb)}</p>}
          {s.beats && (
            <div className="plan-beats">
              {s.beats.arrival && <div className="plan-beat"><span className="plan-beat-label">Walk in:</span> {s.beats.arrival}</div>}
              {s.beats.whyThisWorks && <div className="plan-beat"><span className="plan-beat-label">Why this:</span> {s.beats.whyThisWorks}</div>}
              {s.beats.orderFirst && <div className="plan-beat"><span className="plan-beat-label">Order first:</span> {s.beats.orderFirst}</div>}
              {s.beats.insiderTip && <div className="plan-beat"><span className="plan-beat-label">Insider:</span> {s.beats.insiderTip}</div>}
            </div>
          )}
          <div className="plan-stop-extras">
            {s.whatToWear && <div className="plan-extra"><strong>Wear:</strong> {s.whatToWear}</div>}
            {s.photoSpot && <div className="plan-extra"><strong>Photo spot:</strong> {s.photoSpot}</div>}
          </div>
          <a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="plan-book-btn">
            {s.bookingProvider === 'walk-in' ? 'Get directions →' : 'Find a table →'}
          </a>
          {s.walkTo && i < stops.length - 1 && (
            <div className="plan-walk">
              <span className="plan-walk-badge">{s.walkTo.minutes}m walk</span>
              <span className="plan-walk-line">{s.walkTo.line}</span>
            </div>
          )}
        </article>
      ))}

      {p.paymentNote && (
        <div className="plan-section">
          <h3>At the bill</h3>
          <p>{p.paymentNote}</p>
        </div>
      )}

      {(p.bailoutLine || p.extendLine) && (
        <div className="plan-section plan-section-split">
          {p.extendLine && (
            <div>
              <h4>If it’s going great</h4>
              <p>{p.extendLine}</p>
            </div>
          )}
          {p.bailoutLine && (
            <div>
              <h4>If you need out</h4>
              <p>{p.bailoutLine}</p>
            </div>
          )}
        </div>
      )}

      {p.postDateText && (
        <div className="plan-section">
          <h3>Morning-after text</h3>
          <p className="plan-text-msg">“{p.postDateText}”</p>
        </div>
      )}

      {p.producersNote && (
        <div className="plan-producers-note">
          <p>{p.producersNote}</p>
          <p className="plan-producers-sig">— DatingDex</p>
        </div>
      )}

      <div id="debrief" className="plan-section">
        <h3>How did this go?</h3>
        <p>One tap tells us it worked. One tap makes your next plan smarter.</p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <a href={`${siteUrl}/plan/${params.shareId}?debrief=love`} className="cta cta-secondary">\u2665 Loved it</a>
          <a href={`${siteUrl}/plan/${params.shareId}?debrief=good`} className="cta cta-secondary">Good</a>
          <a href={`${siteUrl}/plan/${params.shareId}?debrief=mid`} className="cta cta-ghost">Mid</a>
          <a href={`${siteUrl}/plan/${params.shareId}?debrief=nope`} className="cta cta-ghost">Not for us</a>
        </div>
      </div>

      <div className="plan-saved-cta">
        <p>Want a plan like this for your next date?</p>
        <Link href="/plan-my-date" className="cta">Build my own ✦</Link>
      </div>
    </div>
  );
}
