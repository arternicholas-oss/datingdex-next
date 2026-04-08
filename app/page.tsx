import Link from 'next/link';
import { VENUES, allVibes, allNeighborhoods } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';

export default function HomePage() {
  const vibes = allVibes();
  const topNbhds = allNeighborhoods().slice(0, 8);
  const featured = [...VENUES].filter(v => (v.score ?? 0) >= 9.5).slice(0, 12);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What are the best first date spots in Washington DC?', acceptedAnswer: { '@type': 'Answer', text: 'DatingDex ranks 309 DC date spots by vibe. Top-rated first date picks cluster in Logan Circle, 14th Street, Shaw, and Georgetown — conversation-friendly cocktail bars and small-plates restaurants that are easy to exit gracefully.' } },
      { '@type': 'Question', name: 'Where should I go for a nice date night in DC?', acceptedAnswer: { '@type': 'Answer', text: 'For an impress-them date, DatingDex highlights fine-dining and rooftop spots in Georgetown, Penn Quarter, and the Wharf. Every listing shows conversation score, vibe, and a one-tap Resy booking link.' } },
      { '@type': 'Question', name: 'How does DatingDex rank date spots?', acceptedAnswer: { '@type': 'Answer', text: 'Each venue is scored on conversation friendliness, vibe match, and exit ease, then tagged by date type and neighborhood.' } },
      { '@type': 'Question', name: 'Is DatingDex free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, browsing and filtering all 309 DC date spots is free. Booking happens directly on Resy or the venue site.' } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="hero container">
        <h1>309 Best Date Spots in Washington DC</h1>
        <p>Hand-picked, ranked, and filtered by vibe. First date. Impress them. Coffee. Late night. Find the right place in one tap.</p>
        <Link href="/discovery" className="cta">Browse all 309 spots →</Link>
      </section>

      <section className="container">
        <h2 style={{ marginTop: '2rem' }}>Pick your vibe</h2>
        <div className="vibe-grid">
          {vibes.map((v) => (
            <Link key={v.slug} href={`/vibe/${v.slug}`} className="vibe-card">
              <h3>{v.name}</h3>
              <p>{v.count} spots</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container">
        <h2>Top neighborhoods</h2>
        <div className="vibe-grid">
          {topNbhds.map((n) => (
            <Link key={n.slug} href={`/dc/${n.slug}`} className="vibe-card">
              <h3>{n.name}</h3>
              <p>{n.count} spots</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container">
        <h2>Highest-rated right now</h2>
        <div className="spots-grid">
          {featured.map((v) => <SpotCard key={v.slug} venue={v} />)}
        </div>
      </section>
    </>
  );
}
