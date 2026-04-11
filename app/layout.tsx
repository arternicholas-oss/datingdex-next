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
    default: '300+ Best Date Spots in Washington DC (2026) \u2014 Ranked by Vibe | DatingDex',
    template: '%s | DatingDex',
  },
  description:
    'The 300+ best date ideas in Washington DC, hand-picked and ranked. Filter by vibe \u2014 first date, impress them, coffee, late night \u2014 plus neighborhood and budget. Free.',
  keywords: [
    'DC date ideas',
    'Washington DC date night',
    'date spots DC',
    'romantic restaurants DC',
    'first date DC',
    'DMV date ideas',
    'Georgetown date',
    'Logan Circle restaurants',
  ],
  authors: [{ name: 'DatingDex' }],
  openGraph: {
    type: 'website',
    siteName: 'DatingDex',
    url: 'https://www.datingdex.com',
    title: '300+ Best Date Spots in Washington DC (2026) | DatingDex',
    description:
      'Hand-picked date ideas across DC, Arlington & Alexandria. Filter by vibe, budget, and neighborhood.',
    images: ['/og-image.jpg'],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: '300+ Best Date Spots in Washington DC (2026) | DatingDex',
    description: 'Hand-picked date ideas across DC, Arlington & Alexandria.',
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
                    <h4>DatingDex</h4>
                    <p>Hand-picked date spots in Washington DC. 300+ venues ranked by vibe, budget, and neighborhood.</p>
                  </div>
                  <div className="footer-col">
                    <h4>Explore</h4>
                    <ul>
                      <li><Link href="/discovery">All Spots</Link></li>
                      <li><Link href="/plan-my-date">Plan My Date</Link></li>
                      <li><Link href="/couples">Couples Mode</Link></li>
                      <li><Link href="/wingman">Wingman Mode</Link></li>
                      <li><Link href="/premium">Premium</Link></li>
                    </ul>
                  </div>
                  <div className="footer-col">
                    <h4>Resources</h4>
                    <ul>
                      <li><Link href="/guides">Blog</Link></li>
                      <li><Link href="/for-restaurants">For Restaurants</Link></li>
                    </ul>
                  </div>
                </div>
                <div className="footer-bottom">
                  <p>&copy; {new Date().getFullYear()} DatingDex &middot; Washington DC &middot; <Link href="/terms">Terms</Link> &middot; <Link href="/privacy">Privacy</Link></p>
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
