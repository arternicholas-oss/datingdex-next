import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VENUES, getVenuesByNeighborhood, allNeighborhoods, allVibes, slugify } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';

export function generateStaticParams() {
  return allNeighborhoods().map((n) => ({ neighborhood: n.slug }));
}

export function generateMetadata({ params }: { params: { neighborhood: string } }): Metadata {
  const list = getVenuesByNeighborhood(params.neighborhood);
  if (!list.length) return { title: 'Not found' };
  const name = list[0].neighborhood;
  const title = `${list.length} Best Date Spots in ${name}, Washington DC (2026)`;
  const description = `The ${list.length} best date ideas in ${name} DC — ranked by vibe, budget, and conversation score. Romantic restaurants, cocktail bars, and coffee dates.`;
  return {
    title, description,
    alternates: { canonical: `https://www.datingdex.com/dc/${params.neighborhood}` },
    openGraph: { title, description, url: `https://www.datingdex.com/dc/${params.neighborhood}` },
  };
}

export default function NeighborhoodPage({ params }: { params: { neighborhood: string } }) {
  const list = getVenuesByNeighborhood(params.neighborhood);
  if (!list.length) return notFound();
  const name = list[0].neighborhood;
  const sorted = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Date Spots in ${name}, Washington DC`,
    description: `The best ${list.length} date ideas in ${name} DC, curated by DatingDex.`,
    url: `https://www.datingdex.com/dc/${params.neighborhood}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: list.length,
      itemListElement: sorted.slice(0, 20).map((v, i) => ({
        '@type': 'ListItem', position: i + 1,
        url: `https://www.datingdex.com/venue/${v.slug}`,
        name: v.name,
      })),
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.datingdex.com' },
      { '@type': 'ListItem', position: 2, name: 'Washington DC', item: 'https://www.datingdex.com/discovery' },
      { '@type': 'ListItem', position: 3, name, item: `https://www.datingdex.com/dc/${params.neighborhood}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>›</span>
          <Link href="/discovery">Washington DC</Link><span>›</span>
          <span>{name}</span>
        </nav>
        <div className="page-hero">
          <h1>{list.length} Best Date Spots in {name}</h1>
          <p>The most date-worthy restaurants, bars, and spots in {name}, Washington DC — ranked by conversation score and vibe.</p>
        </div>

        <section className="seo-content">
          <h2>Dating in {name}</h2>
          <p>
            {name} is one of Washington DC&apos;s most popular neighborhoods for date nights, offering {list.length} hand-picked
            restaurants, bars, and experiences. Whether you&apos;re planning a first date or a special anniversary dinner,
            {name} delivers a range of atmospheres from intimate candlelit bistros to lively cocktail lounges. Every spot
            on this page has been scored by DatingDex across four dimensions — conversation friendliness, vibe, price, and
            ease of exit — so you can find the perfect match for your evening.
          </p>
          <p>
            Prices in {name} range from budget-friendly coffee shops to upscale tasting menus, meaning there&apos;s something
            here no matter your budget. Many of these venues are bookable on Resy in one tap directly from DatingDex.
            Browse the cards below, sorted by overall score, to find your next great date spot.
          </p>
          <h3>Explore other DC neighborhoods</h3>
          <ul className="seo-links">
            {allNeighborhoods().filter(n => n.name !== name).slice(0, 12).map(n => (
              <li key={n.slug}><Link href={`/dc/${n.slug}`}>{n.name} ({n.count})</Link></li>
            ))}
          </ul>
          <h3>Browse by vibe</h3>
          <ul className="seo-links">
            {allVibes().map(v => (
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
