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
        <div className="spots-grid">
          {sorted.map((v) => <SpotCard key={v.slug} venue={v} />)}
        </div>
      </div>
    </>
  );
}
