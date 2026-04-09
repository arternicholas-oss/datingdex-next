import { VENUES, type Venue, slugify } from './venues';

// Map of venue_slug -> restaurant tier ('featured' | 'restaurant_premium').
// Populated at request time and passed into buildItinerary so paying
// restaurants get a score boost in Plan My Date results.
export type RestaurantTierMap = Record<string, 'featured' | 'restaurant_premium'>;

export type PlanInput = {
  city: string;
  situation: string; // first-date, second-date, anniversary, casual-hang, make-it-up
  vibe: string; // low-pressure, romantic, fun-playful, impressive, sexy
  activity: string; // dinner, drinks-only, coffee, activity, full-evening
  budget: string; // under-30, 30-60, 60-100, no-limit  OR dollar amount
  neighborhood?: string; // optional neighborhood filter
  dateAt?: string; // ISO datetime of the date
  freeText?: string;
};

export type Stop = {
  slot: 'before' | 'main' | 'after';
  startTime: string; // HH:MM
  durationMin: number;
  venue: Venue;
  blurb?: string;
  bookingUrl: string;
  bookingProvider: 'resy' | 'opentable' | 'walk-in';
  whatToOrder?: string[];
};

export type Itinerary = {
  input: PlanInput;
  stops: Stop[];
  totalEstimateUsd: [number, number];
  walkingMinutes: number;
  generatedAt: string;
  dressCode?: string;
};

const PRICE_BUCKETS: Record<string, string[]> = {
  'under-30': ['$'],
  '30-60': ['$', '$$'],
  '60-100': ['$$', '$$$'],
  'no-limit': ['$$', '$$$', '$$$$'],
};

const VIBE_TO_TAG: Record<string, string[]> = {
  'low-pressure': ['First Date', 'Coffee Date', 'Casual'],
  'romantic': ['Romantic', 'Impress Them', 'Date Night'],
  'fun-playful': ['Casual', 'Late Night', 'Activity'],
  'impressive': ['Impress Them', 'Romantic'],
  'sexy': ['Late Night', 'Romantic', 'Impress Them'],
};

const ACTIVITY_TO_SLOT: Record<string, ('before' | 'main' | 'after')[]> = {
  'dinner': ['main', 'after'],
  'drinks-only': ['main'],
  'coffee': ['main'],
  'activity': ['main', 'after'],
  'full-evening': ['before', 'main', 'after'],
};

/**
 * Convert dollar amount budget to price bucket.
 * Supports both legacy bucket strings and dollar amounts.
 */
function normalizeBudget(budget: string): string {
  if (PRICE_BUCKETS[budget]) return budget;
  const num = parseInt(budget.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return '30-60';
  if (num < 30) return 'under-30';
  if (num <= 60) return '30-60';
  if (num <= 100) return '60-100';
  return 'no-limit';
}

function score(v: Venue, input: PlanInput, tiers?: RestaurantTierMap): number {
  let s = v.score ?? 7;
  const tagPrefs = VIBE_TO_TAG[input.vibe] || [];
  if (tagPrefs.includes(v.vibe)) s += 1.2;
  const normalizedBudget = normalizeBudget(input.budget);
  if ((PRICE_BUCKETS[normalizedBudget] || []).includes(v.price)) s += 0.6;
  // Neighborhood match gives strong boost
  if (input.neighborhood && slugify(v.neighborhood) === slugify(input.neighborhood)) s += 2.0;
  // Restaurant tier boost - paying restaurants surface more in Plan My Date.
  const tier = tiers?.[v.slug];
  if (tier === 'restaurant_premium') s += 1.5;
  else if (tier === 'featured') s += 0.9;
  // Add small random jitter so repeat runs get variety
  s += Math.random() * 0.5;
  return s;
}

function pickFor(
  slot: 'before' | 'main' | 'after',
  input: PlanInput,
  exclude: Set<string>,
  tiers?: RestaurantTierMap,
  excludeHistory?: Set<string>
): Venue | null {
  const filtered = VENUES.filter((v) => {
    if (exclude.has(v.slug)) return false;
    if (excludeHistory?.has(v.slug)) return false;
    return true;
  });
  const ranked = filtered
    .map((v) => ({ v, s: score(v, input, tiers) + slotBoost(v, slot) }))
    .sort((a, b) => b.s - a.s);
  return ranked[0]?.v ?? null;
}

function slotBoost(v: Venue, slot: 'before' | 'main' | 'after'): number {
  const vibe = v.vibe || '';
  if (slot === 'before') {
    if (/Coffee|Wine|Bar|Cocktail/i.test(vibe)) return 0.8;
  } else if (slot === 'after') {
    if (/Late Night|Bar|Cocktail|Dessert/i.test(vibe)) return 0.8;
  } else {
    if (/Romantic|Impress|Date Night|Dinner/i.test(vibe)) return 0.5;
  }
  return 0;
}

function bookingFor(v: Venue): { url: string; provider: 'resy' | 'opentable' | 'walk-in' } {
  const date = encodeURIComponent(new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10));
  if (v.price === '$') {
    return { url: `https://www.google.com/maps/search/${encodeURIComponent(v.name + ' Washington DC')}`, provider: 'walk-in' };
  }
  return {
    url: `https://resy.com/cities/dc/search?date=${date}&seats=2&query=${encodeURIComponent(v.name)}`,
    provider: 'resy',
  };
}

function priceMidpoint(p: string): number {
  return { '$': 25, '$$': 50, '$$$': 85, '$$$$': 140 }[p] ?? 50;
}

function timeMath(start: string, addMin: number): string {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + addMin;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function buildItinerary(
  input: PlanInput,
  tiers?: RestaurantTierMap,
  excludeHistory?: string[]
): Itinerary {
  const slots = ACTIVITY_TO_SLOT[input.activity] || ['main'];
  const used = new Set<string>();
  const historySet = new Set(excludeHistory || []);
  const stops: Stop[] = [];

  // base start time: 6:30pm if not provided
  let cursor = '18:30';
  if (input.dateAt) {
    const d = new Date(input.dateAt);
    if (!isNaN(d.getTime())) cursor = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  for (const slot of slots) {
    const v = pickFor(slot, input, used, tiers, historySet);
    if (!v) continue;
    used.add(v.slug);
    const dur = slot === 'before' ? 45 : slot === 'main' ? 90 : 60;
    const booking = bookingFor(v);
    stops.push({
      slot,
      startTime: cursor,
      durationMin: dur,
      venue: v,
      bookingUrl: booking.url,
      bookingProvider: booking.provider,
    });
    cursor = timeMath(cursor, dur + 10); // 10 min walk buffer
  }

  const lo = stops.reduce((a, s) => a + priceMidpoint(s.venue.price) * 2 * 0.85, 0);
  const hi = stops.reduce((a, s) => a + priceMidpoint(s.venue.price) * 2 * 1.25, 0);
  const totalEstimateUsd: [number, number] = [Math.round(lo), Math.round(hi)];

  return {
    input,
    stops,
    totalEstimateUsd,
    walkingMinutes: Math.max(0, (stops.length - 1) * 10),
    generatedAt: new Date().toISOString(),
  };
}
