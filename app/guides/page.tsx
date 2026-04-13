import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Dating Guides \u2014 DC, NYC, Atlanta, Miami & Philly (2026)',
  description:
    'Hand-written dating guides for DC, NYC, Atlanta, Miami, and Philadelphia \u2014 first dates, anniversaries, cheap dates under $50, romantic dinners, and rainy day ideas. Updated 2026.',
  alternates: { canonical: 'https://www.datingdex.com/guides' },
};

export default function GuidesIndex() {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Dating Guides \u2014 DC, NYC, Atlanta, Miami & Philly',
    url: 'https://www.datingdex.com/guides',
    hasPart: GUIDES.map((g) => ({
      '@type': 'Article',
      headline: g.h1,
      url: `https://www.datingdex.com/guides/${g.slug}`,
      description: g.description,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <div className="container">
        <header className="page-hero">
          <h1>Dating Guides</h1>
          <p>Hand-written, human-ranked, no listicles. Pick a situation and we will tell you exactly where to go \u2014 across DC, NYC, Atlanta, Miami, and Philadelphia.</p>
        </header>
        <div className="spots-grid">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="spot-card" style={{ padding: '1.25rem', display: 'block' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>{g.title}</h2>
              <p style={{ margin: 0, color: '#555', fontSize: '.95rem', lineHeight: 1.5 }}>{g.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
