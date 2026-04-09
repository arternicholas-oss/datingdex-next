import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVenuesByVibe, allVibes, allNeighborhoods } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';

export function generateStaticParams() {
  return allVibes().map((v) => ({ vibe: v.slug }));
}

export function generateMetadata({ params }: { params: { vibe: string } }): Metadata {
  const list = getVenuesByVibe(params.vibe);
  if (!list.length) return { title: 'Not found' };
  const name = list[0].vibe;
  const title = `${list.length} Best ${name} Spots in Washington DC (2026)`;
  const description = `The ${list.length} best ${name.toLowerCase()} date spots in Washington DC — ranked by conversation score, vibe, and exit ease. Book on Resy in one tap.`;
  return {
    title, description,
    alternates: { canonical: `https://www.datingdex.com/vibe/${params.vibe}` },
    openGraph: { title, description, url: `https://www.datingdex.com/vibe/${params.vibe}` },
  };
}

export default function VibePage({ params }: { params: { vibe: string } }) {
  const list = getVenuesByVibe(params.vibe);
  if (!list.length) return notFound();
  const name = list[0].vibe;
  const sorted = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const collectionJsonLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: `Best ${name} Date Spots in Washington DC`,
    url: `https://www.datingdex.com/vibe/${params.vibe}`,
    mainEntity: {
      '@type': 'ItemList', numberOfItems: list.length,
      itemListElement: sorted.slice(0, 20).map((v, i) => ({
        '@type': 'ListItem', position: i + 1, name: v.name,
        url: `https://www.datingdex.com/venue/${v.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>›</span>
          <span>{name}</span>
        </nav>
        <div className="page-hero">
          <h1>{list.length} Best {name} Spots in Washington DC</h1>
          <p>Hand-picked {name.toLowerCase()} date ideas across Washington DC, Arlington, and Alexandria.</p>
        </div>

        <section className="seo-content">
          <h2>Planning a {name.toLowerCase()} in DC</h2>
          <p>
            Looking for the perfect {name.toLowerCase()} in Washington DC? DatingDex has curated {list.length} top-rated
            spots across the District, Arlington, and Alexandria that nail the {name.toLowerCase()} atmosphere. Each venue
            is scored on conversation friendliness, overall vibe, price range, and how easy it is to leave if things
            aren&apos;t clicking — so you can pick with confidence.
          </p>
          <p>
            From cozy neighborhood gems to buzzworthy new openings, every {name.toLowerCase()} spot below has been
            personally vetted. Browse by score, check prices at a glance, and book your favorite on Resy in one tap.
            Whether you&apos;re a DC local or visiting for the weekend, this curated list takes the guesswork out of
            choosing where to go.
          </p>
          <h3>Top neighborhoods for {name.toLowerCase()} dates</h3>
          <ul className="seo-links">
            {allNeighborhoods().slice(0, 12).map(n => (
              <li key={n.slug}><Link href={`/dc/${n.slug}`}>{n.name} ({n.count})</Link></li>
            ))}
          </ul>
          <h3>Explore other vibes</h3>
          <ul className="seo-links">
            {allVibes().filter(v => v.name !== name).map(v => (
              <li key={v.slug}><Link href={`/vibe/${v.slug}`}>{v.name} ({v.count})</Link></li>
            ))}
          </ul>
        </section>

        <div className="spots-grid">
          {sorted.map((v) => <SpotCard key={v.slug} venue={v} />)}
        </div>
      </div>
    </>
  );
}
