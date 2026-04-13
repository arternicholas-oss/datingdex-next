import type { Metadata } from 'next';
import Link from 'next/link';
import { VENUES } from '@/lib/venues';

export const metadata: Metadata = {
  title: 'Dating Locations — DatingDex',
  description: 'Browse curated date spots across Washington DC, New York, Atlanta, Miami, and Philadelphia. Editorial picks, scored on vibe, conversation, and the moment.',
  alternates: { canonical: 'https://www.datingdex.com/locations' },
};

const CITIES = [
  { slug: 'dc', name: 'Washington, DC', emoji: '\uD83C\uDFDB\uFE0F', neighborhoods: ['Georgetown', 'Shaw', '14th Street', 'Union Market', 'Navy Yard'] },
  { slug: 'nyc', name: 'New York City', emoji: '\uD83D\uDDFD', neighborhoods: ['West Village', 'Williamsburg', 'LES', 'SoHo', 'DUMBO'] },
  { slug: 'atlanta', name: 'Atlanta', emoji: '\uD83C\uDF51', neighborhoods: ['Buckhead', 'Midtown', 'Old Fourth Ward', 'Inman Park', 'Westside'] },
  { slug: 'miami', name: 'Miami', emoji: '\uD83C\uDF34', neighborhoods: ['Wynwood', 'Brickell', 'South Beach', 'Design District', 'Coconut Grove'] },
  { slug: 'philly', name: 'Philadelphia', emoji: '\uD83D\uDD14', neighborhoods: ['Rittenhouse', 'Fishtown', 'East Passyunk', 'Old City', 'Northern Liberties'] },
];

export default function LocationsPage() {
  return (
    <>
      <section className="hero hero-v2">
        <div className="container">
          <div className="hero-badge">{'\u2728'} Dating Locations</div>
          <h1>Curated date spots, city by city.</h1>
          <p className="hero-sub">
            Every venue on DatingDex is hand-scored on the three things that matter on a date: vibe, conversation, and the moment.
          </p>
        </div>
      </section>

      <section className="container city-section">
        <div className="city-grid">
          {CITIES.map((c) => {
            const count = VENUES.filter((v) => (v.city || 'dc') === c.slug).length;
            const live = count > 0;
            return live ? (
              <Link key={c.slug} href={`/${c.slug}`} className="city-card city-live">
                <div className="city-emoji">{c.emoji}</div>
                <h3>{c.name}</h3>
                <p>{count} venues {'\u00B7'} Live</p>
                <p style={{fontSize:'.82rem', color:'var(--muted)'}}>{c.neighborhoods.slice(0, 3).join(' {\u00B7} ')}</p>
                <span className="city-cta">Browse {'\u2192'}</span>
              </Link>
            ) : (
              <div key={c.slug} className="city-card city-soon">
                <div className="city-emoji">{c.emoji}</div>
                <h3>{c.name}</h3>
                <p>200 venues {'\u00B7'} Launching soon</p>
                <p style={{fontSize:'.82rem', color:'var(--muted)'}}>{c.neighborhoods.slice(0, 3).join(' {\u00B7} ')}</p>
                <span className="city-cta">Get notified {'\u2193'}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container" style={{textAlign:'center', padding:'2rem 1.25rem 3rem'}}>
        <h2>Can&apos;t decide?</h2>
        <p style={{color:'var(--muted)', marginBottom:'1.5rem'}}>Let our AI plan the whole night for you in 30 seconds.</p>
        <Link href="/plan-my-date" className="cta cta-primary">Plan a date {'\u2014'} free {'\u2192'}</Link>
      </section>
    </>
  );
}
