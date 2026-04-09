import type { MetadataRoute } from 'next';
import { VENUES, allNeighborhoods, allVibes } from '@/lib/venues';
import { GUIDES } from '@/lib/guides';

const BASE = 'https://www.datingdex.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/discovery`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/plan`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/plan-my-date`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/premium`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for-restaurants`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for-restaurants/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
  ];
  for (const g of GUIDES) {
    routes.push({ url: `${BASE}/guides/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: 'monthly', priority: 0.85 });
  }
  for (const v of VENUES) {
    routes.push({ url: `${BASE}/venue/${v.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 });
  }
  for (const n of allNeighborhoods()) {
    routes.push({ url: `${BASE}/dc/${n.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 });
  }
  for (const v of allVibes()) {
    routes.push({ url: `${BASE}/vibe/${v.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 });
  }
  return routes;
}
