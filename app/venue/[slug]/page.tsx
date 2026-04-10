import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VENUES, getVenueBySlug, slugify, priceLabel } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';
import DatingIntelligence from '@/components/DatingIntelligence';
import type { DatingIntelligenceData } from '@/lib/datingIntelligence';

export function generateStaticParams() {
  return VENUES.map((v) => ({ slug: v.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const v = getVenueBySlug(params.slug);
  if (!v) return { title: 'Not found' };

  const title = `${v.name} â ${v.vibe} Date Spot in ${v.neighborhood} DC`;
  const description = `${v.name} in ${v.neighborhood}: ${v.desc} ${priceLabel(v.price)}. Ranked ${v.score ?? 'top'} on DatingDex.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.datingdex.com/venue/${v.slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.datingdex.com/venue/${v.slug}`,
      images: v.photo ? [{ url: v.photo }] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: v.photo ? [v.photo] : undefined,
    },
  };
}

export default function VenuePage({ params }: { params: { slug: string } }) {
  const v = getVenueBySlug(params.slug);
  if (!v) return notFound();

  const related = VENUES.filter(
    (x) => x.slug !== v.slug && (x.neighborhood === v.neighborhood || x.vibe === v.vibe)
  ).slice(0, 6);

  const restaurantJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `https://www.datingdex.com/venue/${v.slug}`,
    name: v.name,
    description: v.desc,
    image: v.photo || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: v.neighborhood,
      addressRegion: 'DC',
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
      reviewBody: `${v.hook}. ${v.desc}`,
    };
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.datingdex.com' },
      {
        '@type': 'ListItem',
        position: 2,
        name: v.neighborhood,
        item: `https://www.datingdex.com/dc/${slugify(v.neighborhood)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: v.name,
        item: `https://www.datingdex.com/venue/${v.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>âº</span>
          <Link href={`/dc/${slugify(v.neighborhood)}`}>{v.neighborhood}</Link>
          <span>âº</span>
          <span>{v.name}</span>
        </nav>

        <div className="page-hero">
          <div className="spot-meta" style={{ fontSize: '.95rem' }}>
            <Link href={`/vibe/${slugify(v.vibe)}`}>{v.vibe}</Link>
            <span>Â·</span>
            <Link href={`/dc/${slugify(v.neighborhood)}`}>{v.neighborhood}</Link>
            <span>Â·</span>
            <span>
              {v.price} Â· {priceLabel(v.price)}
            </span>
            {v.score !== null && (
              <>
                <span>Â·</span>
                <span>â {v.score.toFixed(1)}</span>
              </>
            )}
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

          {v.dating_intelligence ? (
            <DatingIntelligence data={v.dating_intelligence as DatingIntelligenceData} />
          ) : null}

          <p style={{ marginTop: '1rem' }}>
            {v.desc}
          </p>
          <p style={{ marginTop: '.75rem' }}>
            {v.name} is one of the top {v.vibe.toLowerCase()} spots in {v.neighborhood}.{' '}
            At a {priceLabel(v.price).toLowerCase()} price point, it fits well when you want
            a {v.vibe.toLowerCase()} feel without guesswork.
          </p>
        </section>

        {related.length > 0 && (
          <section style={{ margin: '2.5rem 0' }}>
            <h2>
              More {v.vibe.toLowerCase()} spots in {v.neighborhood}
            </h2>
            <div className="spots-grid">
              {related.map((r) => (
                <SpotCard key={r.slug} venue={r} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
