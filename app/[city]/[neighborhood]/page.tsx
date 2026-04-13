import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VENUES, slugify, allVibes } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';

const CITY_NAMES: Record<string, string> = {
  dc: 'Washington, DC', nyc: 'New York City', atlanta: 'Atlanta', miami: 'Miami', philly: 'Philadelphia',
};

export function generateStaticParams() {
  const out: { city: string; neighborhood: string }[] = [];
  for (const v of VENUES) {
    const city = v.city || 'dc';
    out.push({ city, neighborhood: slugify(v.neighborhood) });
  }
  return Array.from(new Map(out.map((x) => [`${x.city}/${x.neighborhood}`, x])).values());
}

export function generateMetadata({ params }: { params: { city: string; neighborhood: string } }): Metadata {
  const list = VENUES.filter((v) => (v.city || 'dc') === params.city && slugify(v.neighborhood) === params.neighborhood);
  if (!list.length) return { title: 'Not found' };
  const name = list[0].neighborhood;
  const cityName = CITY_NAMES[params.city] || params.city;
  const title = `${list.length} Best Date Spots in ${name}, ${cityName} (2026)`;
  const description = `The ${list.length} best date ideas in ${name}, ${cityName} \u2014 ranked by vibe, conversation, and budget.`;
  return {
    title, description,
    alternates: { canonical: `https://www.datingdex.com/${params.city}/${params.neighborhood}` },
    openGraph: { title, description, url: `https://www.datingdex.com/${params.city}/${params.neighborhood}` },
  };
}

export default function NeighborhoodPage({ params }: { params: { city: string; neighborhood: string } }) {
  const list = VENUES.filter((v) => (v.city || 'dc') === params.city && slugify(v.neighborhood) === params.neighborhood);
  if (!list.length) return notFound();
  const name = list[0].neighborhood;
  const cityName = CITY_NAMES[params.city] || params.city;
  const sorted = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>{'\u203A'}</span>
        <Link href="/locations">Locations</Link><span>{'\u203A'}</span>
        <Link href={`/${params.city}`}>{cityName}</Link><span>{'\u203A'}</span>
        <span>{name}</span>
      </nav>
      <div className="page-hero">
        <h1>{list.length} Best Date Spots in {name}, {cityName}</h1>
        <p>The most date-worthy restaurants, bars, and experiences in {name}, {cityName}.</p>
      </div>

      {/* Group venues by vibe */}
      {(() => {
        const byVibe = new Map<string, typeof sorted>();
        for (const v of sorted) {
          const key = v.vibe;
          if (!byVibe.has(key)) byVibe.set(key, []);
          byVibe.get(key)!.push(v);
        }
        const vibeOrder = Array.from(byVibe.entries()).sort((a, b) => b[1].length - a[1].length);
        // If there's only one vibe, show flat grid (no need to group)
        if (vibeOrder.length <= 1) {
          return (
            <div className="spots-grid">
              {sorted.map((v) => <SpotCard key={v.slug} venue={v} />)}
            </div>
          );
        }
        return (
          <>
            {vibeOrder.map(([vibe, venues]) => (
              <section key={vibe} style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ marginTop: '1.5rem' }}>
                  <Link href={`/vibe/${slugify(vibe)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {vibe} in {name}
                  </Link>
                </h2>
                <div className="spots-grid">
                  {venues.map((v) => <SpotCard key={v.slug} venue={v} />)}
                </div>
              </section>
            ))}
          </>
        );
      })()}

      <section className="seo-content">
        <h3>Explore other {cityName} neighborhoods</h3>
        <ul className="seo-links">
          {Array.from(new Set(VENUES.filter((v) => (v.city || 'dc') === params.city).map((v) => v.neighborhood)))
            .filter((n) => n !== name)
            .slice(0, 12)
            .map((n) => (
              <li key={n}><Link href={`/${params.city}/${slugify(n)}`}>{n}</Link></li>
            ))}
        </ul>
      </section>
    </div>
  );
}
