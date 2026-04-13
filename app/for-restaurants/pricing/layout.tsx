import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing for Restaurants \u2014 Featured & Premium Placement',
  description:
    'Put your restaurant in front of 1,200+ date-night searchers every month. Featured and Premium placements boost your rankings on city, neighborhood, and AI-planned itineraries.',
  alternates: { canonical: 'https://www.datingdex.com/for-restaurants/pricing' },
  openGraph: {
    title: 'Pricing for Restaurants \u2014 DatingDex',
    description: 'Featured and Premium placement for restaurants on DatingDex. Reach date-night diners in DC, NYC, Atlanta, Miami, and Philly.',
    type: 'website',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
