import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import AuthModal from '@/components/AuthModal';
import HeaderNav from '@/components/HeaderNav';
import PostHogProvider from '@/components/PostHogProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.datingdex.com'),
  title: {
    default: 'DatingDex \u2014 AI Date Night Planner for DC, NYC, Atlanta, Miami & Philly',
    template: '%s | DatingDex',
  },
  description:
    'Plan your whole date night in 30 seconds. AI-choreographed dinner, drinks, and after-spot across DC, NYC, Atlanta, Miami, and Philadelphia. 1,200+ hand-curated venues, scored by vibe.',
  keywords: [
    'AI date planner',
    'date night planner',
    'date night ideas',
    'DC date ideas',
    'NYC date ideas',
    'Atlanta date ideas',
    'Miami date ideas',
    'Philadelphia date ideas',
    'romantic restaurants',
    'first date spots',
  ],
  authors: [{ name: 'DatingDex' }],
  openGraph: {
    type: 'website',
    siteName: 'DatingDex',
    url: 'https://www.datingdex.com',
    title: 'DatingDex \u2014 AI Date Night Planner for DC, NYC, Atlanta, Miami & Philly',
    description:
      'Your entire date night, choreographed. 1,200+ curated venues across 5 cities, planned for your vibe and budget in 30 seconds.',
    images: ['/og-image.jpg'],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DatingDex \u2014 AI Date Night Planner for 5 US Cities',
    description: 'Your entire date night, choreographed. 1,200+ curated venues across DC, NYC, Atlanta, Miami, and Philly.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  } as any,
  alternates: { canonical: 'https://www.datingdex.com' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DatingDex',
  url: 'https://www.datingdex.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.datingdex.com/discovery?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DatingDex',
  url: 'https://www.datingdex.com',
  logo: 'https://www.datingdex.com/og-image.png',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#FF5C3A" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>
          <PostHogProvider>
            <a href="#main-content" className="skip-to-content">Skip to content</a>
            <header className="site-header">
              <div className="inner">
                <Link href="/" className="logo">DatingDex</Link>
                <HeaderNav />
              </div>
            </header>

            <main id="main-content">{children}</main>

            <footer className="footer">
              <div className="footer-inner">
                <div className="footer-top">
                  <div className="footer-col">
                    <h3>DatingDex</h3>
                    <p>AI date night planner and curated directory. 1,200+ venues across DC, NYC, Atlanta, Miami, and Philadelphia, scored by vibe.</p>
                  </div>
                  <div className="footer-col">
                    <h3>Explore</h3>
                    <ul>
                      <li><Link href="/locations">Locations</Link></li>
                      <li><Link href="/plan-my-date">Plan My Date</Link></li>
                      <li><Link href="/couples">Couples Mode</Link></li>
                      <li><Link href="/wingman">Wingman Mode</Link></li>
                      <li><Link href="/premium">Premium</Link></li>
                    </ul>
                  </div>
                  <div className="footer-col">
                    <h3>Cities</h3>
                    <ul>
                      <li><Link href="/dc">Washington, DC</Link></li>
                      <li><Link href="/nyc">New York City</Link></li>
                      <li><Link href="/atlanta">Atlanta</Link></li>
                      <li><Link href="/miami">Miami</Link></li>
                      <li><Link href="/philly">Philadelphia</Link></li>
                    </ul>
                  </div>
                  <div className="footer-col">
                    <h3>Resources</h3>
                    <ul>
                      <li><Link href="/guides">Guides</Link></li>
                      <li><Link href="/for-restaurants">For Restaurants</Link></li>
                    </ul>
                  </div>
                </div>
                <div className="footer-bottom">
                  <p>&copy; {new Date().getFullYear()} DatingDex &middot; <Link href="/terms">Terms</Link> &middot; <Link href="/privacy">Privacy</Link></p>
                </div>
              </div>
            </footer>
            <AuthModal />
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
