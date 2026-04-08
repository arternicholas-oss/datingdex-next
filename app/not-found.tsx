import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
      <h1>Spot not found</h1>
      <p>We couldn&apos;t find that date spot. Try browsing <Link href="/discovery">all 309 spots</Link>.</p>
    </div>
  );
}
