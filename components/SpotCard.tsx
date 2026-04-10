import Link from 'next/link';
import type { Venue } from '@/lib/venues';

export default function SpotCard({ venue }: { venue: Venue }) {
  return (
    <Link href={`/venue/${venue.slug}`} className="spot-card" aria-label={`View ${venue.name} details`}>
      <div className="spot-img" style={venue.photo ? { backgroundImage: `url("${venue.photo}")` } : undefined}>
        {!venue.photo && <span className="spot-img-emoji" aria-hidden>🍽️</span>}
        <div className="spot-badge">{venue.vibe}</div>
        {venue.score !== null && <div className="spot-score">{venue.score.toFixed(1)}</div>}
      </div>

      <div className="spot-body">
        <div className="spot-meta">
          <span>{venue.neighborhood}</span>
          <span>·</span>
          <span>{venue.price}</span>
        </div>
        <div className="spot-name">{venue.name}</div>
        <div className="spot-hook">{venue.hook}</div>
        {venue.desc && venue.desc.trim() !== venue.hook.trim() && (
          <div className="spot-desc">{venue.desc}</div>
        )}
      </div>
    </Link>
  );
}
