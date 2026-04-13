import type { Metadata } from 'next';
import { VENUES } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';
import DiscoveryFilter from '@/components/DiscoveryFilter';

export const metadata: Metadata = {
  title: 'All 1,218 Date Spots \u2014 DC, NYC, Atlanta, Miami & Philly',
  description: 'Browse every hand-picked date spot on DatingDex. 1,218 venues across Washington DC, New York City, Atlanta, Miami, and Philadelphia. Filter by vibe, neighborhood, and price.',
  alternates: { canonical: 'https://www.datingdex.com/discovery' },
};

export default function DiscoveryPage() {
  const sorted = [...VENUES].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const neighborhoods = [...new Set(VENUES.map(v => v.neighborhood))].sort();
  const vibes = [...new Set(VENUES.map(v => v.vibe))].sort();
  return (
    <div className="container">
      <div className="page-hero">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span>All Spots</nav>
        <h1>All {sorted.length} Date Spots {'\u2014'} DC, NYC, Atlanta, Miami & Philly</h1>
        <p>Every spot on DatingDex, ranked by overall score. Filter by city, vibe, or neighborhood.</p>
      </div>
      <DiscoveryFilter neighborhoods={neighborhoods} vibes={vibes} />
      <div className="spots-grid">
        {sorted.map((v) => <SpotCard key={v.slug} venue={v} />)}
      </div>
    </div>
  );
}
