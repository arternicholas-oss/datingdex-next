import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Couples Mode — Plan Dates Together',
  description:
    'Share a profile with your partner, sync date preferences, and plan together. A DatingDex feature for couples.',
  alternates: { canonical: 'https://www.datingdex.com/couples' },
};

export default function CouplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
