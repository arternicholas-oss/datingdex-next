/**
 * IP-based city detection for defaulting the planner to the user\u2019s city.
 * Uses Vercel\u2019s edge geo headers when available (free, no external call).
 * Falls back to 'dc' if unknown.
 */

import type { CitySlug } from './planner';

const SUPPORTED: CitySlug[] = ['dc', 'nyc', 'atlanta', 'miami', 'philly'];

// Very rough mapping of US metro areas \u2192 our supported cities.
// Vercel headers expose x-vercel-ip-city, x-vercel-ip-country-region, x-vercel-ip-latitude/longitude.
const CITY_MATCHERS: Array<{ city: CitySlug; regex: RegExp; regions?: string[] }> = [
  { city: 'dc', regex: /washington|arlington|alexandria|bethesda|silver spring|rockville|takoma park/i, regions: ['DC', 'VA', 'MD'] },
  { city: 'nyc', regex: /new york|brooklyn|queens|bronx|manhattan|staten island|jersey city|hoboken|newark/i, regions: ['NY', 'NJ'] },
  { city: 'atlanta', regex: /atlanta|decatur|marietta|sandy springs|alpharetta|buckhead/i, regions: ['GA'] },
  { city: 'miami', regex: /miami|miami beach|coral gables|aventura|hialeah|doral|kendall/i, regions: ['FL'] },
  { city: 'philly', regex: /philadelphia|philly|camden|cherry hill|wilmington/i, regions: ['PA', 'NJ', 'DE'] },
];

export function cityFromHeaders(headers: Headers): CitySlug | null {
  const vercelCity = headers.get('x-vercel-ip-city');
  const vercelRegion = headers.get('x-vercel-ip-country-region');
  const vercelCountry = headers.get('x-vercel-ip-country');
  if (vercelCountry && vercelCountry !== 'US') return null;
  const decodedCity = vercelCity ? decodeURIComponent(vercelCity) : '';
  if (!decodedCity && !vercelRegion) return null;

  for (const m of CITY_MATCHERS) {
    if (decodedCity && m.regex.test(decodedCity)) return m.city;
  }
  if (vercelRegion) {
    for (const m of CITY_MATCHERS) {
      if (m.regions?.includes(vercelRegion)) return m.city;
    }
  }
  return null;
}

export function citySlugFromCookie(cookieValue: string | undefined): CitySlug | null {
  if (!cookieValue) return null;
  const v = cookieValue.toLowerCase();
  return (SUPPORTED as string[]).includes(v) ? (v as CitySlug) : null;
}

export function defaultCity(): CitySlug {
  return 'dc';
}
