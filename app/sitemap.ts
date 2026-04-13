import type { MetadataRoute } from 'next';
import { VENUES, allNeighborhoods, allVibes, slugify, type City } from '@/lib/venues';
import { GUIDES } from '@/lib/guides';

const BASE = 'https://www.datingdex.com';
const CITIES: City[] = ['dc', 'nyc', 'atlanta', 'miami', 'philly'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/locations`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/discovery`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/plan`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/plan-my-date`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/couples`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/premium`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/wingman`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/for-restaurants`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for-restaurants/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Guides
  for (const g of GUIDES) {
    routes.push({ url: `${BASE}/guides/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: 'monthly', priority: 0.85 });
  }

  // Venue detail pages (all cities)
  for (const v of VENUES) {
    routes.push({ url: `${BASE}/venue/${v.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 });
  }

  // City index + neighborhood pages (all 5 cities)
  for (const city of CITIES) {
    routes.push({ url: `${BASE}/${city}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 });
    for (const n of allNeighborhoods(city)) {
      routes.push({ url: `${BASE}/${city}/${n.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 });
    }
  }

  // Vibe pages
  for (const v of allVibes()) {
    routes.push({ url: `${BASE}/vibe/${v.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 });
  }

  // Programmatic city/neighborhood/vibe combinations (only where venues exist)
  for (const city of CITIES) {
    for (const h of allNeighborhoods(city)) {
      for (const vb of allVibes()) {
        const exists = VENUES.some(
          (x) => (x.city || 'dc') === city && slugify(x.neighborhood) === h.slug && slugify(x.vibe) === vb.slug,
        );
        if (exists) {
          routes.push({ url: `${BASE}/${city}/${h.slug}/${vb.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 });
        }
      }
    }
  }

  return routes;
}
