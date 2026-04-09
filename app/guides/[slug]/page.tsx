import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDES, getGuideBySlug, allGuideSlugs } from '@/lib/guides';
import { VENUES } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';

export function generateStaticParams() {
  return allGuideSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGuideBySlug(params.slug);
  if (!g) return { title: 'Not found' };
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `https://www.datingdex.com/guides/${g.slug}` },
    openGraph: {
      title: g.title,
      description: g.description,
      url: `https://www.datingdex.com/guides/${g.slug}`,
      type: 'article',
      publishedTime: g.published,
      modifiedTime: g.updated,
    },
    twitter: {
      card: 'summary_large_image',
      title: g.title,
      description: g.description,
    },
  };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = getGuideBySlug(params.slug);
  if (!g) return notFound();

  const picks = g.pickVenues(VENUES);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.h1,
    description: g.description,
    datePublished: g.published,
    dateModified: g.updated,
    author: { '@type': 'Organization', name: 'DatingDex' },
    publisher: {
      '@type': 'Organization',
      name: 'DatingDex',
      logo: { '@type': 'ImageObject', url: 'https://www.datingdex.com/favicon.ico' },
    },
    mainEntityOfPage: `https://www.datingdex.com/guides/${g.slug}`,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: g.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.datingdex.com' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://www.datingdex.com/guides' },
      { '@type': 'ListItem', position: 3, name: g.title, item: `https://www.datingdex.com/guides/${g.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <article className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>›</span>
          <Link href="/guides">Guides</Link><span>›</span>
          <span>{g.title}</span>
        </nav>

        <header className="page-hero">
          <h1>{g.h1}</h1>
          <p style={{ color: '#666', fontSize: '.95rem' }}>
            Updated {new Date(g.updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · By DatingDex
          </p>
          {g.intro.map((p, i) => (
            <p key={i} style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>{p}</p>
          ))}
        </header>

        {picks.length > 0 && (
          <section style={{ margin: '2.5rem 0' }}>
            <h2>The picks</h2>
            <div className="spots-grid">
              {picks.map((v) => <SpotCard key={v.slug} venue={v} />)}
            </div>
          </section>
        )}

        {g.sections.map((s, i) => (
          <section key={i} style={{ margin: '2rem 0' }}>
            <h2>{s.h2}</h2>
            {s.body.map((p, j) => (
              <p key={j} style={{ lineHeight: 1.7 }}>{p}</p>
            ))}
          </section>
        ))}

        <section style={{ margin: '2.5rem 0' }}>
          <h2>Frequently asked questions</h2>
          {g.faq.map((f, i) => (
            <div key={i} style={{ margin: '1.25rem 0' }}>
              <h3 style={{ margin: '0 0 .35rem' }}>{f.q}</h3>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </section>

        <section style={{ margin: '2.5rem 0', padding: '1.5rem', background: '#fafafa', borderRadius: 'var(--radius)' }}>
          <h2 style={{ marginTop: 0 }}>More DatingDex guides</h2>
          <ul>
            {GUIDES.filter((o) => o.slug !== g.slug).map((o) => (
              <li key={o.slug}><Link href={`/guides/${o.slug}`}>{o.title}</Link></li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
