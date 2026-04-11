import Link from 'next/link';
import { VENUES, allVibes, allNeighborhoods } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';
import EmailCapture from '@/components/EmailCapture';
import EventbriteTonight from '@/components/EventbriteTonight';

export default function HomePage() {
  const vibes = allVibes();
  const featured = [...VENUES].filter(v => (v.score ?? 0) >= 9.5).slice(0, 9);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'How does DatingDex plan a date for me?', acceptedAnswer: { '@type': 'Answer', text: 'Answer 3 quick questions \u2014 neighborhood, vibe, and budget \u2014 and our AI plans a choreographed night: arrival time, where to sit, what to order, conversation openers, and the walk between stops. Every stop is booked in one tap.' } },
      { '@type': 'Question', name: 'Is DatingDex free?', acceptedAnswer: { '@type': 'Answer', text: 'Your first 3 date plans are free. Unlimited plans, Date Copilot (dress code + conversation scripts), saved favorites, and Couples Mode come with Pro at $12/month.' } },
      { '@type': 'Question', name: 'What makes DatingDex different from Yelp or Resy?', acceptedAnswer: { '@type': 'Answer', text: 'Yelp ranks restaurants. Resy books tables. DatingDex choreographs the entire night \u2014 arrival timing, what to order first, conversation hooks tied to each venue, where to sit, and how to transition between stops. It\'s the only tool built specifically for dates.' } },
      { '@type': 'Question', name: 'Does DatingDex work for couples?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Couples Mode lets both partners save spots, vote on tonight\'s plan, and get anniversary reminders. It\'s the easiest way to stop arguing about where to eat.' } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ==================== HERO ==================== */}
      <section className="hero hero-v2">
        <div className="container">
          <div className="hero-badge">{'\u2728'} AI date director for Washington DC</div>
          <h1>Your entire date night, choreographed.</h1>
          <p className="hero-sub">
            Where to sit. What to order. What to say. How to get there.
            {VENUES.length}+ DC spots, one AI that plans the whole night in <strong>30 seconds</strong>.
          </p>
          <p className="hero-proof">
            <span className="dot" /> 1,284 dates planned this month · Trusted by DC couples since 2024
          </p>
          <div className="hero-ctas">
            <Link href="/plan-my-date" className="cta cta-primary">Plan my date — free →</Link>
          </div>
        </div>
      </section>

      {/* ==================== 3 DOORS ==================== */}
      <section className="container doors-section">
        <div className="doors-grid">
          <Link href="/plan?mode=tonight" className="door-card door-tonight">
            <div className="door-icon">🌃</div>
            <h2>Tonight</h2>
            <p>It&apos;s 5pm. You need a plan. We&apos;ll build one in 30 seconds with what&apos;s happening in DC right now.</p>
            <span className="door-cta">Plan tonight →</span>
          </Link>
          <Link href="/plan?mode=impress" className="door-card door-impress">
            <div className="door-icon">✨</div>
            <h2>Impress Them</h2>
            <p>Anniversary, third date, or someone you want to wow. Choreographed down to the conversation opener.</p>
            <span className="door-cta">Impress them →</span>
          </Link>
          <Link href="/couples" className="door-card door-couples">
            <div className="door-icon">💑</div>
            <h2>We&apos;re a Couple</h2>
            <p>Save spots together. Vote on tonight. Get anniversary reminders. Your shared date brain.</p>
            <span className="door-cta">Try Couples Mode →</span>
          </Link>
        </div>
      </section>

      {/* ==================== TONIGHT IN DC (Eventbrite) ==================== */}
      <section className="container tonight-section">
        <EventbriteTonight />
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="container how-it-works">
        <h2>How DatingDex works</h2>
        <div className="how-grid">
          <div className="how-step">
            <div className="how-num">1</div>
            <h3>3 questions, 30 seconds</h3>
            <p>Neighborhood, vibe, budget. That&apos;s it. Or just type what you&apos;d tell a friend.</p>
          </div>
          <div className="how-step">
            <div className="how-num">2</div>
            <h3>Get a choreographed night</h3>
            <p>Arrival time, where to sit, what to order first, conversation hooks, walk directions between stops.</p>
          </div>
          <div className="how-step">
            <div className="how-num">3</div>
            <h3>Book in one tap</h3>
            <p>Resy and OpenTable links built in. Reservation locked in 10 seconds, not 10 minutes.</p>
          </div>
        </div>
        <div className="how-cta">
          <Link href="/plan-my-date" className="cta cta-primary">Plan my date {'\u2014'} free {'\u2192'}</Link>
        </div>
      </section>

      {/* ==================== COUPLES TEASER ==================== */}
      <section className="couples-teaser container">
        <div className="couples-card">
          <div>
            <div className="hero-badge">New {'\u00B7'} Couples Mode</div>
            <h2>Stop arguing about where to eat.</h2>
            <p>
              Save spots together. Vote on tonight&apos;s plan. Get anniversary reminders.
              Couples Mode turns DatingDex into your shared date brain.
            </p>
            <Link href="/couples" className="cta cta-primary">Try Couples Mode {'\u2192'}</Link>
          </div>
          <div className="couples-illo" aria-hidden>{'\uD83D\uDC91'}</div>
        </div>
      </section>

      {/* ==================== VIBES ==================== */}
      <section className="container">
        <h2>Pick your vibe</h2>
        <p className="section-sub">Every DC spot, hand-scored on the three things that matter on a date.</p>
        <div className="vibe-grid">
          {vibes.map((v) => (
            <Link key={v.slug} href={`/vibe/${v.slug}`} className="vibe-card">
              <h3>{v.name}</h3>
              <p>{v.count} spots</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== TOP PICKS ==================== */}
      <section className="container">
        <h2>Top picks</h2>
        <p className="section-sub">Highest-rated spots across every vibe. Tap one, see the full vibe breakdown, book it.</p>
        <div className="spots-grid">
          {featured.map((v) => <SpotCard key={v.slug} venue={v} />)}
        </div>
      </section>

      {/* ==================== TONIGHT IN DC (Eventbrite) ==================== */}
      <section className="container tonight-section">
        <h2>Tonight in DC</h2>
        <p className="section-sub">Live events from Eventbrite {'\u2014'} fold one into your date plan.</p>
        <EventbriteTonight />
      </section>

      {/* ==================== EMAIL ==================== */}
      <section className="container">
        <EmailCapture />
      </section>
    </>
  );
}
