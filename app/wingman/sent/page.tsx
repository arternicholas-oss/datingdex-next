'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function SentContent() {
  const params = useSearchParams();
  const giftId = params.get('id');

  return (
    <div className="container plan-page" style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
      <h1>You&apos;re a great wingman.</h1>
      <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: 520, margin: '0.5rem auto 2rem', lineHeight: 1.6 }}>
        The date plan is being built right now. We&apos;ll deliver a fully choreographed evening —
        where to go, when to arrive, what to order — straight to their inbox.
        {giftId && (
          <span style={{ display: 'block', marginTop: '0.75rem', color: '#888', fontSize: '0.9rem' }}>
            Gift ID: {giftId}
          </span>
        )}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/wingman" className="cta cta-secondary">Send another</Link>
        <Link href="/plan" className="cta">Plan your own date</Link>
      </div>
    </div>
  );
}

export default function WingmanSentPage() {
  return (
    <Suspense fallback={<div className="container plan-page" style={{ textAlign: 'center', padding: '3rem' }}><p>Loading...</p></div>}>
      <SentContent />
    </Suspense>
  );
}
