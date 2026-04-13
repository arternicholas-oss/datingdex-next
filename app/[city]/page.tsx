import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VENUES, allVibes, slugify } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';

const CITY_META: Record<string, { name: string; state: string; blurb: string; neighborhoods: string[] }> = {
  dc: { name: 'Washington', state: 'DC', blurb: 'Power-lunch capital with a surprisingly soft side. Georgetown townhouse bistros, 14th Street cocktail temples, and Union Market chef experiments make up the dating map.', neighborhoods: ['Georgetown', 'Shaw', '14th Street', 'Union Market', 'Navy Yard', 'Capitol Hill', 'Logan Circle', 'Dupont'] },
  nyc: { name: 'New York', state: 'NY', blurb: 'The most competitive dining market in the country. Reservations are a sport, tiny rooms create forced intimacy, and the best dates involve multiple stops on foot.', neighborhoods: ['West Village', 'East Village', 'Williamsburg', 'Lower East Side', 'SoHo', 'DUMBO', 'Greenwich Village', 'Chelsea'] },
  atlanta: { name: 'Atlanta', state: 'GA', blurb: 'Southern hospitality meets new-money energy. Strong Black culture, chef-driven restaurants, and patio weather eight months a year.', neighborhoods: ['Buckhead', 'Midtown', 'Old Fourth Ward', 'Inman Park', 'West Midtown', 'Poncey-Highland', 'Virginia-Highland', 'Westside'] },
  miami: { name: 'Miami', state: 'FL', blurb: 'Latin influence is everywhere \u2014 food, music, energy. Rooftops and waterfront dining year-round. Late-night is real here; 9pm dinner is early.', neighborhoods: ['Wynwood', 'Brickell', 'South Beach', 'Design District', 'Coconut Grove', 'Coral Gables', 'Little Havana', 'Edgewater'] },
  philly: { name: 'Philadelphia', state: 'PA', blurb: 'Underrated dining city punching way above its weight. BYO culture is huge, walkable neighborhoods, less pretentious than NYC and more food-obsessed than DC.', neighborhoods: ['Rittenhouse Square', 'Fishtown', 'East Passyunk', 'Old City', 'Northern Liberties', 'Center City', 'Queen Village', 'Graduate Hospital'] },
};

export function generateStaticParams() {
  return Object.keys(CITY_META).map((city) => ({ city }));
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  const meta = CITY_META[params.city];
  if (!meta) return { title: 'Not found' };
  const count = VENUES.filter((v) => (v.city || 'dc') === params.city).length;
  const title = count > 0
    ? `${count} Best Date Spots in ${meta.name}, ${meta.state} (2026) | DatingDex`
    : `Date Spots in ${meta.name}, ${meta.state} \u2014 Launching Soon | DatingDex`;
  const description = count > 0
    ? `Curated ${count} best date restaurants, bars, and experiences in ${meta.name}. Scored on vibe, conversation, and the moment.`
    : `DatingDex is launching in ${meta.name}, ${meta.state}. Join the waitlist for 200+ curated date spots.`;
  return {
    title, description,
    alternates: { canonical: `https://www.datingdex.com/${params.city}` },
    openGraph: { title, description, url: `https://www.datingdex.com/${params.city}` },
  };
}

export default function CityPage({ params }: { params: { city: string } }) {
  const meta = CITY_META[params.city];
  if (!meta) return notFound();
  const list = VENUES.filter((v) => (v.city || 'dc') === params.city);
  const sorted = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = sorted.slice(0, 12);

  // Coming-soon state
  if (list.length === 0) {
    return (
      <div className="container" style={{padding:'3rem 1.25rem', textAlign:'center', maxWidth:720}}>
        <div className="hero-badge">{'\uD83D\uDCCD'} {meta.name}, {meta.state}</div>
        <h1 style={{marginTop:'1rem'}}>Launching in {meta.name} soon</h1>
        <p style={{color:'var(--muted)', fontSize:'1.1rem', margin:'1rem 0 2rem'}}>
          {meta.blurb}
        </p>
        <p style={{color:'var(--muted)', marginBottom:'2rem'}}>
          200+ curated venues coming to {meta.name}. Join the waitlist to be first in.
        </p>
        <Link href="/#app-waitlist" className="cta cta-primary">Join the waitlist {'\u2192'}</Link>
        <div style={{marginTop:'3rem'}}>
          <h3>Dating neighborhoods we&apos;ll cover</h3>
          <p style={{color:'var(--muted)'}}>{meta.neighborhoods.join(' {\u00B7} ')}</p>
        </div>
      </div>
    );
  }

  // Live city
  const neighborhoodList = Array.from(new Set(list.map((v) => v.neighborhood))).sort();
  const vibes = allVibes().filter((v) => list.some((x) => slugify(x.vibe) === v.slug));

  return (
    <div className="container">
      <div className="page-hero">
        <div className="hero-badge">{'\uD83D\uDCCD'} {meta.name}, {meta.state}</div>
        <h1>The {list.length} Best Date Spots in {meta.name}</h1>
        <p>{meta.blurb}</p>
      </div>

      <section>
        <h2>Top picks</h2>
        <div className="spots-grid">
          {top.map((v) => <SpotCard key={v.slug} venue={v} />)}
        </div>
      </section>

      <section style={{marginTop:'3rem'}}>
        <h2>Browse by neighborhood</h2>
        <ul className="seo-links">
          {neighborhoodList.map((n) => (
            <li key={n}><Link href={`/${params.city}/${slugify(n)}`}>{n}</Link></li>
          ))}
        </ul>
      </section>

      <section style={{marginTop:'3rem'}}>
        <h2>Browse by vibe</h2>
        <ul className="seo-links">
          {vibes.map((v) => (
            <li key={v.slug}><Link href={`/vibe/${v.slug}`}>{v.name} ({v.count})</Link></li>
          ))}
        </ul>
      </section>

      <section style={{marginTop:'3rem', textAlign:'center', padding:'2rem 0'}}>
        <h2>Can&apos;t decide?</h2>
        <p style={{color:'var(--muted)', marginBottom:'1.5rem'}}>Let our AI plan your whole night in {meta.name}.</p>
        <Link href={`/plan-my-date?city=${params.city}`} className="cta cta-primary">Plan a date in {meta.name} {'\u2192'}</Link>
      </section>
    </div>
  );
}
