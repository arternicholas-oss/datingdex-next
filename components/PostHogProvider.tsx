'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';

let initialized = false;

function ensureInit() {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false,
    persistence: 'localStorage+cookie',
  });
  initialized = true;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    ensureInit();
    if (initialized && pathname) {
      const url = window.location.origin + pathname + (search?.toString() ? `?${search.toString()}` : '');
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, search]);

  return <>{children}</>;
}

export function track(event: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  ensureInit();
  if (initialized) posthog.capture(event, props);
}
