import type { Metadata } from 'next';
import { VENUES } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';

export const metadata: Metadata = {
  title: 'All DC Date Spots — Browse by Vibe, Neighborhood & Budget',
  description: 'Browse all hand-picked date spots in Washington DC. Filter by vibe, neighborhood, and price. Book on Resy in one tap.',
  alternates: { canonical: 'https://www.datingdex.com/discovery' },
};

export default function DiscoveryPage() {
  const sorted = [...VENUES].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return (
    <div className="container">
      <div className="page-hero">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span>All Spots</nav>
        <h1>All {sorted.length} Date Spots in Washington DC</h1>
        <p>Every spot on DatingDex, ranked by overall score. Filter by vibe or neighborhood in the nav above.</p>
      </div>
      <div className="spots-grid">
        {sorted.map((v) => <SpotCard key={v.slug} venue={v} />)}
      </div>
    </div>
  );
}
