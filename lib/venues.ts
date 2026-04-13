import venuesData from '@/data/venues.json';
import type { DatingIntelligenceData } from '@/lib/datingIntelligence';

export type City = 'dc' | 'nyc' | 'atlanta' | 'miami' | 'philly';

export type Venue = {
  slug: string;
  name: string;
  city: City;
  neighborhood: string;
  price: string;
  vibe: string;
  score: number | null;
  hook: string;
  desc: string;
  photo: string | null;
  scores: { convo: string | null; vibe: string | null; exit: string | null };
  dating_intelligence?: DatingIntelligenceData;
};

export const VENUES: Venue[] = (venuesData as any[]).map((v) => ({ ...v, city: (v.city || 'dc') as City })) as Venue[];

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function getVenueBySlug(slug: string): Venue | undefined {
  return VENUES.find((v) => v.slug === slug);
}

export function getVenuesByCity(city: City): Venue[] {
  return VENUES.filter((v) => v.city === city);
}

export function getVenuesByNeighborhood(slug: string, city?: City): Venue[] {
  return VENUES.filter((v) => slugify(v.neighborhood) === slug && (!city || v.city === city));
}

export function getVenuesByVibe(slug: string, city?: City): Venue[] {
  return VENUES.filter((v) => slugify(v.vibe) === slug && (!city || v.city === city));
}

export function allNeighborhoods(city?: City): { slug: string; name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const v of VENUES) {
    if (city && v.city !== city) continue;
    const s = slugify(v.neighborhood);
    if (!map.has(s)) map.set(s, { name: v.neighborhood, count: 0 });
    map.get(s)!.count++;
  }
  return Array.from(map.entries()).map(([slug, v]) => ({ slug, ...v })).sort((a, b) => b.count - a.count);
}

export function allVibes(city?: City): { slug: string; name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const v of VENUES) {
    if (city && v.city !== city) continue;
    const s = slugify(v.vibe);
    if (!map.has(s)) map.set(s, { name: v.vibe, count: 0 });
    map.get(s)!.count++;
  }
  return Array.from(map.entries()).map(([slug, v]) => ({ slug, ...v })).sort((a, b) => b.count - a.count);
}

export function priceLabel(price: string): string {
  return { '$': 'Budget', '$$': 'Moderate', '$$$': 'Upscale', '$$$$': 'Fine Dining' }[price] || price;
}
