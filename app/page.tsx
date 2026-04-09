import Link from 'next/link';
import { VENUES, allVibes, allNeighborhoods } from '@/lib/venues';
import SpotCard from '@/components/SpotCard';
import EmailCapture from '@/components/EmailCapture';

export default function HomePage() {
  const vibes = allVibes();
  const topNbhds = allNeighborhoods().slice(0, 8);
  const featured = [...VENUES].filter(v => (v.score ?? 0) >= 9.5).slice(0, 9);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'How does DatingDex plan a date for me?', acceptedAnswer: { '@type': 'Answer', text: 'Answer 4 quick questions — who it\'s for, the vibe, the budget, the neighborhood — and our AI plans a full night: pre-drink, dinner, the walk, the nightcap, even the Uber home. Every stop is booked in one tap.' } },
      { '@type': 'Question', name: 'Is DatingDex free?', acceptedAnswer: { '@type': 'Answer', text: 'Your first date plan is free. Unlimited plans, post-date debriefs, saved favorites, and Couples Mode come with Premium at $9.99/month.' } },
      { '@type': 'Question', name: 'What makes DatingDex different from Yelp or Resy?', acceptedAnswer: { '@type': 'Answer', text: 'Yelp ranks restaurants. Resy books tables. DatingDex plans the entire night — and it\'s the only tool built specifically for dates, ranking spots on conversation, vibe, and how gracefully you can exit if things go sideways.' } },
      { '@type': 'Question', name: 'Does DatingDex work for couples?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Couples Mode lets both partners save spots, vote on tonight\'s plan, and get anniversary reminders. It\'s the easiest way to stop arguing about where to eat.' } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="hero hero-v2">
        <div className="container">
          <div className="hero-badge">✦ AI date planner for Washington DC</div>
          <h1>Stop panicking at 5pm on a Friday.</h1>
          <p className="hero-sub">
            Tell us the vibe. We'll plan the whole night — pre-drink, dinner, the walk, the nightcap.
            309 DC spots, ranked by <strong>conversation</strong>, not stars.
          </p>
          <div className="hero-ctas">
            <Link href="/plan-my-date" className="cta cta-primary">Plan my date → free, 60 seconds</Link>
            <Link href="/discovery" className="cta cta-ghost">Or browse all 309 spots</Link>
          </div>
          <p className="hero-proof">
            <span className="dot" /> 1,284 dates planned this month · Trusted by DC couples since 2024
          </p>
        </div>
      </section>

      <section className="container how-it-works">
        <h2>How DatingDex works</h2>
        <div className="how-grid">
          <div className="how-step">
            <div className="how-num">1</div>
            <h3>Answer 4 questions</h3>
            <p>Who it's for, the vibe, the budget, which side of the city. Takes 60 seconds.</p>
          </div>
          <div className="how-step">
            <div className="how-num">2</div>
            <h3>Get a full-night plan</h3>
            <p>Restaurant, backup, walk, nightcap — AI-picked from the best 309 spots in DC.</p>
          </div>
          <div className="how-step">
            <div className="how-num">3</div>
            <h3>Book in one tap</h3>
            <p>Resy, OpenTable, and direct links built in. No more six tabs open at 5pm.</p>
          </div>
        </div>
        <div className="how-cta">
          <Link href="/plan-my-date" className="cta cta-primary">Try it free →</Link>
        </div>
      </section>

      <section className="couples-teaser container">
        <div className="couples-card">
          <div>
            <div className="hero-badge">New · Couples Mode</div>
            <h2>Stop arguing about where to eat.</h2>
            <p>
              Save spots together. Vote on tonight's plan. Get anniversary reminders.
              Couples Mode turns DatingDex into your shared date brain.
            </p>
            <Link href="/couples" className="cta cta-primary">Try Couples Mode →</Link>
          </div>
          <div className="couples-illo" aria-hidden>💑</div>
        </div>
      </section>

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
        <h2>Tonight's top picks</h2>
        <p className="section-sub">Highest-rated spots across every vibe. Tap one, see the full vibe breakdown, book it.</p>
        <div className="spots-grid">
          {featured.map((v) => <SpotCard key={v.slug} venue={v} />)}
        </div>
      </section>

      <section className="container">
        <EmailCapture />
      </section>
    </>
  );
}
