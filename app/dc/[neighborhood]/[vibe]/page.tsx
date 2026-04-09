import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VENUES, allNeighborhoods, allVibes, slugify } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';

type Params = { neighborhood: string; vibe: string };

export function generateStaticParams() {
  const hoods = allNeighborhoods();
  const vibes = allVibes();
  const out: Params[] = [];
  for (const h of hoods) {
    for (const v of vibes) {
      const match = VENUES.some(
        x => slugify(x.neighborhood) === h.slug && slugify(x.vibe) === v.slug
      );
      if (match) out.push({ neighborhood: h.slug, vibe: v.slug });
    }
  }
  return out;
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const hood = allNeighborhoods().find(h => h.slug === params.neighborhood);
  const vibe = allVibes().find(v => v.slug === params.vibe);
  if (!hood || !vibe) return {};
  const title = `${vibe.name} Date Spots in ${hood.name}, DC (2026)`;
  const description = `The best ${vibe.name.toLowerCase()} date spots in ${hood.name}, Washington DC — ranked by conversation, vibe, and how gracefully you can exit. Book in one tap.`;
  const canonical = `https://www.datingdex.com/dc/${params.neighborhood}/${params.vibe}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default function NeighborhoodVibePage({ params }: { params: Params }) {
  const hood = allNeighborhoods().find(h => h.slug === params.neighborhood);
  const vibe = allVibes().find(v => v.slug === params.vibe);
  if (!hood || !vibe) return notFound();

  const spots = VENUES
    .filter(v => slugify(v.neighborhood) === params.neighborhood && slugify(v.vibe) === params.vibe)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  if (spots.length === 0) return notFound();

  return (
    <>
      <section className="hero hero-v2">
        <div className="container">
          <div className="hero-badge">✦ {hood.name} · {vibe.name}</div>
          <h1>{vibe.name} date spots in {hood.name}</h1>
          <p className="hero-sub">
            {spots.length} hand-picked {vibe.name.toLowerCase()} spots in {hood.name}, ranked on conversation, vibe, and exit ease.
          </p>
          <div className="hero-ctas">
            <Link href="/plan-my-date" className="cta cta-primary">Plan my night here →</Link>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="spots-grid">
          {spots.map(v => <SpotCard key={v.slug} venue={v} />)}
        </div>
      </section>

      <section className="container" style={{ padding: '2rem 1.25rem' }}>
        <h2>Other vibes in {hood.name}</h2>
        <div className="vibe-grid">
          {allVibes()
            .filter(v => v.slug !== params.vibe && VENUES.some(x => slugify(x.neighborhood) === params.neighborhood && slugify(x.vibe) === v.slug))
            .map(v => (
              <Link key={v.slug} href={`/dc/${params.neighborhood}/${v.slug}`} className="vibe-card">
                <h3>{v.name}</h3>
                <p>in {hood.name}</p>
              </Link>
            ))}
        </div>
      </section>
    </>
  );
}
