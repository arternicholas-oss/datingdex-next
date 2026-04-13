import Link from 'next/link';
import AppWaitlist from '@/components/AppWaitlist';

export default function HomePage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'How does DatingDex plan a date?', acceptedAnswer: { '@type': 'Answer', text: 'Tell us your city, vibe, and budget. Our AI plans a full choreographed night \u2014 where to go, where to sit, what to order, and conversation hooks.' } },
      { '@type': 'Question', name: 'Which cities does DatingDex cover?', acceptedAnswer: { '@type': 'Answer', text: 'DatingDex is live in Washington DC, New York City, Atlanta, Miami, and Philadelphia \u2014 with 1,200+ hand-curated venues across all five cities.' } },
      { '@type': 'Question', name: 'Is DatingDex free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes \u2014 plan dates for free on the web. The DatingDex app adds memory, Couples Mode, post-date debriefs, and push notifications.' } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ==================== HERO — PLANNER-FIRST ==================== */}
      <section className="hero hero-v2">
        <div className="container">
          <div className="hero-badge">{'\u2728'} AI Date Planner</div>
          <h1>Your entire date night, choreographed.</h1>
          <p className="hero-sub">
            Where to go. Where to sit. What to order. What to say. Planned in <strong>30 seconds</strong>
            {' '}by an AI that actually knows your city.
          </p>
          <div className="hero-ctas">
            <Link href="/plan-my-date" className="cta cta-primary">Plan a date {'\u2014'} free {'\u2192'}</Link>
            <a href="#app-waitlist" className="cta cta-ghost">Get the app {'\u2192'}</a>
          </div>
          <p className="hero-footnote" style={{marginTop:'1rem', color:'var(--muted)', fontSize:'.9rem'}}>
            Live in DC, NYC, Atlanta, Miami & Philly {'\u00B7'} 1,200+ hand-curated venues
          </p>
        </div>
      </section>

      {/* ==================== CITIES GRID ==================== */}
      <section className="container cities-grid-section" style={{padding:'3rem 1.25rem 1rem'}}>
        <h2 style={{textAlign:'center', marginBottom:'.5rem'}}>Now in 5 cities</h2>
        <p style={{textAlign:'center', color:'var(--muted)', marginBottom:'2rem'}}>
          Hand-curated venues, scored by vibe. Planned for your night.
        </p>
        <div className="cities-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'1rem'}}>
          <Link href="/dc" className="city-card" style={{display:'block', padding:'1.5rem', border:'1px solid var(--border, #eee)', borderRadius:'16px', textDecoration:'none', background:'var(--card, #fff)'}}>
            <h3 style={{margin:'0 0 .25rem'}}>Washington, DC</h3>
            <p style={{margin:0, color:'var(--muted)', fontSize:'.9rem'}}>296 venues {'\u00B7'} 22 neighborhoods</p>
          </Link>
          <Link href="/nyc" className="city-card" style={{display:'block', padding:'1.5rem', border:'1px solid var(--border, #eee)', borderRadius:'16px', textDecoration:'none', background:'var(--card, #fff)'}}>
            <h3 style={{margin:'0 0 .25rem'}}>New York City</h3>
            <p style={{margin:0, color:'var(--muted)', fontSize:'.9rem'}}>230 venues {'\u00B7'} Manhattan & Brooklyn</p>
          </Link>
          <Link href="/atlanta" className="city-card" style={{display:'block', padding:'1.5rem', border:'1px solid var(--border, #eee)', borderRadius:'16px', textDecoration:'none', background:'var(--card, #fff)'}}>
            <h3 style={{margin:'0 0 .25rem'}}>Atlanta</h3>
            <p style={{margin:0, color:'var(--muted)', fontSize:'.9rem'}}>231 venues {'\u00B7'} Buckhead, Midtown & more</p>
          </Link>
          <Link href="/miami" className="city-card" style={{display:'block', padding:'1.5rem', border:'1px solid var(--border, #eee)', borderRadius:'16px', textDecoration:'none', background:'var(--card, #fff)'}}>
            <h3 style={{margin:'0 0 .25rem'}}>Miami</h3>
            <p style={{margin:0, color:'var(--muted)', fontSize:'.9rem'}}>231 venues {'\u00B7'} Wynwood, Brickell & beach</p>
          </Link>
          <Link href="/philly" className="city-card" style={{display:'block', padding:'1.5rem', border:'1px solid var(--border, #eee)', borderRadius:'16px', textDecoration:'none', background:'var(--card, #fff)'}}>
            <h3 style={{margin:'0 0 .25rem'}}>Philadelphia</h3>
            <p style={{margin:0, color:'var(--muted)', fontSize:'.9rem'}}>230 venues {'\u00B7'} Rittenhouse, Fishtown & more</p>
          </Link>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="container how-it-works">
        <h2>How DatingDex works</h2>
        <div className="how-grid">
          <div className="how-step"><div className="how-num">1</div><h3>Tell us the night</h3><p>City, vibe, budget. Or just type what you&apos;d tell a friend.</p></div>
          <div className="how-step"><div className="how-num">2</div><h3>Get a choreographed plan</h3><p>Arrival time, where to sit, what to order first, conversation hooks, walking directions between stops.</p></div>
          <div className="how-step"><div className="how-num">3</div><h3>Book in one tap</h3><p>Resy and OpenTable built in. Reservation locked in 10 seconds, not 10 minutes.</p></div>
        </div>
        <div className="how-cta">
          <Link href="/plan-my-date" className="cta cta-primary">Plan a date {'\u2014'} free {'\u2192'}</Link>
        </div>
      </section>

      {/* ==================== APP WAITLIST ==================== */}
      <section id="app-waitlist" className="container">
        <AppWaitlist />
      </section>

      {/* ==================== LOCATIONS LINK ==================== */}
      <section className="container" style={{textAlign:'center', padding:'1rem 1.25rem 3rem'}}>
        <p style={{color:'var(--muted)', marginBottom:'.75rem'}}>Want to browse curated date spots?</p>
        <Link href="/locations" className="cta cta-ghost">Browse Dating Locations {'\u2192'}</Link>
      </section>
    </>
  );
}
