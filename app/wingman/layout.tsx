import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wingman Mode — Plan a Date for Someone Else',
  description:
    'Be the hero. Build a surprise date night for a friend, partner, or couple you love. Fully choreographed plan delivered to their inbox. $7.99 one-time.',
  alternates: { canonical: 'https://www.datingdex.com/wingman' },
};

export default function WingmanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
