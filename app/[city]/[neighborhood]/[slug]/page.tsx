import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VENUES, getVenueBySlug, slugify, priceLabel, type City } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';
import DatingIntelligence from '@/components/DatingIntelligence';
import type { DatingIntelligenceData } from '@/lib/datingIntelligence';

const CITY_LABEL: Record<City, { name: string; state: string }> = {
  dc: { name: 'Washington', state: 'DC' },
  nyc: { name: 'New York', state: 'NY' },
  atlanta: { name: 'Atlanta', state: 'GA' },
  miami: { name: 'Miami', state: 'FL' },
  philly: { name: 'Philadelphia', state: 'PA' },
};

type P = { city: string; neighborhood: string; slug: string };

// Pre-render all venues with their canonical /:city/:neighborhood/:slug paths
export function generateStaticParams() {
  return VENUES.map((v) => ({
    city: v.city,
    neighborhood: slugify(v.neighborhood),
    slug: v.slug,
  }));
}

export function generateMetadata({ params }: { params: P }): Metadata {
  const v = getVenueBySlug(params.slug);
  if (!v) return { title: 'Not found' };
  const cityLbl = CITY_LABEL[v.city] || CITY_LABEL.dc;
  const title = `${v.name} \u2014 ${v.vibe} Date Spot in ${v.neighborhood}, ${cityLbl.state}`;
  const desc = `${v.name} in ${v.neighborhood}, ${cityLbl.name}: ${v.desc} ${priceLabel(v.price)}. Ranked ${v.score ?? 'top'} on DatingDex.`;
  const canonical = `https://www.datingdex.com/${v.city}/${slugify(v.neighborhood)}/${v.slug}`;
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      images: v.photo ? [{ url: v.photo }] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: v.photo ? [v.photo] : undefined,
    },
  };
}

export default function DeepVenuePage({ params }: { params: P }) {
  const v = getVenueBySlug(params.slug);
  if (!v) notFound();

  // Validate that the city + neighborhood in the URL actually match this venue.
  // If not, 404 (prevents bad URLs from being indexed).
  if (v.city !== params.city || slugify(v.neighborhood) !== params.neighborhood) {
    return notFound();
  }

  const related = VENUES.filter(
    (x) => x.slug !== v.slug && x.city === v.city && (x.neighborhood === v.neighborhood || x.vibe === v.vibe)
  ).slice(0, 6);

  const canonical = `https://www.datingdex.com/${v.city}/${slugify(v.neighborhood)}/${v.slug}`;

  const restaurantJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': canonical,
    name: v.name,
    description: v.desc,
    image: v.photo || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: v.neighborhood,
      addressRegion: (CITY_LABEL[v.city] || CITY_LABEL.dc).state,
      addressCountry: 'US',
    },
    priceRange: v.price,
    servesCuisine: v.hook,
  };

  if (v.score !== null) {
    restaurantJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: v.score,
      bestRating: 10,
      worstRating: 1,
      ratingCount: 1,
      reviewCount: 1,
    };
    restaurantJsonLd.review = {
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: v.score, bestRating: 10 },
      author: { '@type': 'Organization', name: 'DatingDex' },
      reviewBody: v.desc,
    };
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.datingdex.com' },
      { '@type': 'ListItem', position: 2, name: (CITY_LABEL[v.city] || CITY_LABEL.dc).name, item: `https://www.datingdex.com/${v.city}` },
      { '@type': 'ListItem', position: 3, name: v.neighborhood, item: `https://www.datingdex.com/${v.city}/${slugify(v.neighborhood)}` },
      { '@type': 'ListItem', position: 4, name: v.name, item: canonical },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <article className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>{'\u203A'}</span>
          <Link href={`/${v.city}`}>{(CITY_LABEL[v.city] || CITY_LABEL.dc).name}</Link>
          <span>{'\u203A'}</span>
          <Link href={`/${v.city}/${slugify(v.neighborhood)}`}>{v.neighborhood}</Link>
          <span>{'\u203A'}</span>
          <span>{v.name}</span>
        </nav>

        <div className="page-hero">
          <div className="spot-meta" style={{ fontSize: '.95rem' }}>
            <Link href={`/vibe/${slugify(v.vibe)}`}>{v.vibe}</Link>
            <span>{'\u00B7'}</span>
            <Link href={`/${v.city}/${slugify(v.neighborhood)}`}>{v.neighborhood}</Link>
            <span>{'\u00B7'}</span>
            <span>{v.price} {'\u00B7'} {priceLabel(v.price)}</span>
            {v.score !== null && (<><span>{'\u00B7'}</span><span>{'\u2B50'} {v.score.toFixed(1)}</span></>)}
          </div>
          <h1>{v.name}</h1>
          <p style={{ fontSize: '1.15rem', color: '#444' }}>{v.hook}</p>
        </div>

        {v.photo && (
          <div
            style={{
              margin: '1.5rem 0',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              aspectRatio: '16/9',
              backgroundImage: `url("${v.photo}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-label={`Photo of ${v.name}`}
            role="img"
          />
        )}

        <section style={{ margin: '2rem 0' }}>
          <h2>What DatingDex says</h2>
          {v.dating_intelligence && <DatingIntelligence data={v.dating_intelligence as DatingIntelligenceData} />}
          <p style={{ marginTop: '1rem' }}>{v.desc}</p>
          <p style={{ marginTop: '.75rem' }}>
            {v.name} is one of the top {v.vibe.toLowerCase()} spots in {v.neighborhood}. At a{' '}
            {priceLabel(v.price).toLowerCase()} price point, it fits when you want a{' '}
            {v.vibe.toLowerCase()} feel without guesswork.
          </p>
          <p style={{ marginTop: '1rem' }}>
            <Link href={`/plan-my-date?city=${v.city}`} className="cta">Plan a night around {v.name} \u2726</Link>
          </p>
        </section>

        {related.length > 0 && (
          <section style={{ margin: '2.5rem 0' }}>
            <h2>More {v.vibe.toLowerCase()} spots in {v.neighborhood}</h2>
            <div className="spots-grid">
              {related.map((r) => <SpotCard key={r.slug} venue={r} />)}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
