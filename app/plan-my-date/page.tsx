import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Plan My Date — AI Date Night Planner for Washington DC',
  description:
    'Tell us about your date in plain English. We build a complete timestamped night — where to go, when to arrive, what to order, and how to book — in 30 seconds. Built for DC.',
  alternates: { canonical: 'https://www.datingdex.com/plan-my-date' },
  openGraph: {
    title: 'Plan My Date — AI Date Night Planner for DC',
    description: 'A complete date night plan in 30 seconds. Dinner, drinks before, after-spot — all walkable, all bookable.',
    type: 'website',
    images: ['/og-image.jpg'],
  },
};

const FAQ = [
  {
    q: 'What does a "plan" actually include?',
    a: 'A timestamped itinerary with up to three stops — a before-dinner drink, dinner, and an after-spot — chosen so they\'re close enough to walk between, fit your budget, and match the vibe you described. Each stop has a 4-sentence breakdown of why it works for your specific situation, what to order first, where to sit, and a one-tap booking link.',
  },
  {
    q: 'How is this different from just searching Google Maps?',
    a: 'Maps gives you 50 restaurants ranked by review count. Plan My Date gives you one full night, optimized for your specific situation — the vibe you said you wanted, the budget you set, the walking distances, the timing. It\'s the difference between a list and a plan.',
  },
  {
    q: 'How does the AI part work?',
    a: 'You describe the date in plain English ("second date, she likes natural wine, $120 budget"). Claude parses what you said, our planner ranks 309 hand-curated DC venues against your situation, and Claude writes you personalized 4-sentence reasons each pick works — referencing what you actually told us. No generic blurbs.',
  },
  {
    q: 'Is it free?',
    a: 'You get 3 full plans for free with an account. Premium ($9.99/mo) gives you unlimited plans, the post-date debrief that makes your next plan smarter, saved itineraries, and exclusive features like Hidden Gems and Anniversary Mode.',
  },
  {
    q: 'Does it actually book the reservation?',
    a: 'We deep-link you straight into the booking flow on Resy with your date and party size pre-filled. One tap, the reservation page is already half-done. For walk-in spots we link you to directions instead.',
  },
  {
    q: 'How does the post-date debrief work?',
    a: 'The morning after your date, we email you a 15-second "how\'d it go?" form. Whatever you tell us — she loved the small plates, it was too loud, you ended up walking to a third spot — feeds into your next plan automatically. Recommendations get smarter the more you use it.',
  },
];

export default function PlanMyDateLanding() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Plan My Date by DatingDex',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '127' },
  };

  return (
    <div className="pmd">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <section className="pmd-hero">
        <div className="container">
          <div className="pmd-eyebrow">Plan My Date <span className="ai-tag">AI</span></div>
          <h1>The whole night, planned in 30 seconds.</h1>
          <p className="pmd-lede">
            Tell us about the date in plain English. We build a complete timestamped night — drinks before, dinner, after-spot — all walkable, all bookable, all matched to the vibe you actually want.
          </p>
          <div className="pmd-cta-row">
            <Link href="/plan" className="cta">Plan my night ✦</Link>
            <Link href="/premium" className="cta cta-secondary">See Premium</Link>
          </div>
          <p className="pmd-fineprint">3 free plans · No credit card · Built for Washington DC</p>
        </div>
      </section>

      <section className="pmd-how">
        <div className="container">
          <h2>How it works</h2>
          <div className="pmd-steps">
            <div className="pmd-step">
              <div className="pmd-step-num">1</div>
              <h3>Describe your date</h3>
              <p>One sentence is enough. &ldquo;Second date, she likes natural wine, hates loud places, $120 budget.&rdquo; Or use the chips if you prefer.</p>
            </div>
            <div className="pmd-step">
              <div className="pmd-step-num">2</div>
              <h3>We build the night</h3>
              <p>Our planner picks the right spots from 309 hand-curated DC venues, clusters them so you can walk between them, and writes you personalized reasons each one fits.</p>
            </div>
            <div className="pmd-step">
              <div className="pmd-step-num">3</div>
              <h3>Book in one tap</h3>
              <p>Each stop has a Resy deep-link with your date and party size pre-filled. Reservation in 10 seconds, not 10 minutes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pmd-without-with">
        <div className="container">
          <h2>Without DatingDex vs. with DatingDex</h2>
          <div className="pmd-compare">
            <div className="pmd-col pmd-col-bad">
              <h3>The old way</h3>
              <ul>
                <li>30 minutes Googling &ldquo;best date night DC&rdquo;</li>
                <li>15 reviews that all say &ldquo;great vibe&rdquo;</li>
                <li>Pick a restaurant. Hope it&apos;s not too loud.</li>
                <li>Realize you didn&apos;t plan a drink before, scramble.</li>
                <li>Forget to book. They&apos;re full at 7pm.</li>
              </ul>
            </div>
            <div className="pmd-col pmd-col-good">
              <h3>With Plan My Date</h3>
              <ul>
                <li>One sentence. 30 seconds.</li>
                <li>A timestamped night: drinks → dinner → after</li>
                <li>All within walking distance</li>
                <li>4 sentences per spot on why it works for <em>you</em></li>
                <li>One-tap booking, table locked in</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="pmd-features">
        <div className="container">
          <h2>What makes the AI different</h2>
          <div className="pmd-feature-grid">
            <div className="pmd-feature">
              <div className="pmd-feature-icon">🗣</div>
              <h3>Natural language input</h3>
              <p>Skip the form. Type what you&apos;d tell a friend. Claude extracts the situation, vibe, budget, and dietary stuff automatically.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">✍️</div>
              <h3>Personalized reasons, not canned blurbs</h3>
              <p>Every recommendation comes with 4 sentences written for <em>your</em> situation: tied to what you told us, with sensory details, the strategic angle, and an insider tip.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">🚶</div>
              <h3>Distance-clustered itineraries</h3>
              <p>Drinks, dinner, and after-spot are picked so you can walk between them. The whole night fits a 4-block radius unless you tell us otherwise.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">📬</div>
              <h3>Post-date debrief that makes you smarter</h3>
              <p>The next morning, we email you one question. Whatever you tell us feeds your next plan. Recommendations get sharper every time you use it.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">🎁</div>
              <h3>Anniversary Mode <span className="pmd-pill">Premium</span></h3>
              <p>Multi-day, multi-stop, narrative-shaped plans for milestones. Friday peak romance, Saturday low-key, Saturday night the surprise. AI does the constraint solving.</p>
            </div>
            <div className="pmd-feature">
              <div className="pmd-feature-icon">🚨</div>
              <h3>Rescue Mode <span className="pmd-pill">Premium</span></h3>
              <p>It&apos;s 6pm, the plan fell through, you&apos;re 20 min away. One button rebuilds your night using only what&apos;s open right now.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pmd-faq">
        <div className="container">
          <h2>FAQ</h2>
          {FAQ.map((f, i) => (
            <details key={i} className="pmd-faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="pmd-final">
        <div className="container">
          <h2>Ready to skip the planning?</h2>
          <p>3 free plans. No credit card. 30 seconds.</p>
          <Link href="/plan" className="cta">Plan my night ✦</Link>
        </div>
      </section>
    </div>
  );
}
