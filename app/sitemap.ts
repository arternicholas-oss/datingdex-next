import type { MetadataRoute } from 'next';
import { VENUES, allNeighborhoods, allVibes, slugify } from '@/lib/venues';
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
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
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
  // programmatic: /dc/[hood]/[vibe]
  for (const h of allNeighborhoods()) {
    for (const vb of allVibes()) {
      const exists = VENUES.some(x => slugify(x.neighborhood) === h.slug && slugify(x.vibe) === vb.slug);
      if (exists) routes.push({ url: `${BASE}/dc/${h.slug}/${vb.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 });
    }
  }
  routes.push({ url: `${BASE}/couples`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 });
  return routes;
}
