import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Premium — DatingDex Pro Plans',
  description:
    'Unlimited date plans, Date Copilot, personalized recommendations, and Couples Mode. From $12/month.',
  alternates: { canonical: 'https://www.datingdex.com/premium' },
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
