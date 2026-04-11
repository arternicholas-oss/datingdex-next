'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        We hit an unexpected error. This has been logged and we&apos;ll look into it.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#FF5C3A',
          color: '#fff',
          border: 'none',
          padding: '.75rem 1.5rem',
          borderRadius: '10px',
          fontSize: '1rem',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Try again
      </button>
    </div>
  );
}
