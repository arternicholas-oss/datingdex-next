import { VENUES, type Venue, slugify, type City } from './venues';

// ------------------------------------------------------------
// v3 input shape — the 6-question guided wizard
// ------------------------------------------------------------

export type CitySlug = City;
export type Occasion =
  | 'first-date'
  | 'early-dates'
  | 'regular'
  | 'special'
  | 'something-else';
export type VibeChoice =
  | 'impressive'
  | 'intimate'
  | 'low-pressure'
  | 'classic-romantic'
  | 'adventurous'
  | 'something-else';
export type Shape = 'dinner-only' | 'drinks-and-dinner' | 'full-night';
export type Budget = 'under-60' | '60-120' | '120-200' | '200-plus' | 'flexible';
export type Activity = 'none' | 'live-music' | 'active' | 'creative' | 'outdoor';
export type When = 'tonight' | 'this-weekend' | string; // else ISO datetime

export type PlanInput = {
  city: CitySlug;
  when: When;
  dateAt?: string; // ISO datetime if specific
  occasion: Occasion;
  occasionNote?: string; // if "something else"
  vibe: VibeChoice;
  vibeNote?: string; // if "something else"
  shape: Shape;
  budget: Budget;
  activity?: Activity; // DC-only bonus question
  neighborhood?: string; // future: optional constraint
  freeText?: string; // legacy support
};

// Legacy fields some older callers may still pass. We normalize onto v3.
export type LegacyPlanInput = {
  situation?: string;
  vibe?: string;
  activity?: string;
  budget?: string;
};

export type RestaurantTierMap = Record<string, 'featured' | 'restaurant_premium'>;

export type Stop = {
  slot: 'before' | 'main' | 'after' | 'activity';
  startTime: string; // HH:MM
  durationMin: number;
  venue: Venue;
  blurb?: string; // flowing choreography prose
  beats?: {
    arrival?: string;
    whyThisWorks?: string;
    orderFirst?: string;
    insiderTip?: string;
  };
  walkTo?: {
    minutes: number;
    line: string;
  };
  conversationHook?: string;
  whatToWear?: string;
  photoSpot?: string;
  bookingUrl: string;
  bookingProvider: 'resy' | 'opentable' | 'walk-in';
};

export type PlanPayload = {
  // Narrative layer
  coldOpen: string;
  nightAtAGlance: string;
  producersNote: string;
  bailoutLine?: string; // first-date-only
  extendLine?: string;
  postDateText: string;
  // Logistics
  timingSheet: {
    leaveBy: string;
    arriveBy: string;
    rideEstimateMin: number;
    reservationHoldMin: number;
  };
  weather?: {
    forecast: string;
    tempF: number;
    note: string;
  };
  playlist?: {
    name: string;
    url: string;
    note: string;
  };
  paymentNote?: string;
  backups?: Array<{ slot: 'before' | 'main' | 'after'; name: string; slug: string; why: string }>;
};

export type Itinerary = {
  input: PlanInput;
  stops: Stop[];
  totalEstimateUsd: [number, number];
  walkingMinutes: number;
  generatedAt: string;
  dressCode?: string;
  payload?: PlanPayload;
};

// ------------------------------------------------------------
// Scoring & selection
// ------------------------------------------------------------

const BUDGET_TO_PRICE: Record<Budget, string[]> = {
  'under-60': ['$', '$$'],
  '60-120': ['$$', '$$$'],
  '120-200': ['$$$', '$$$$'],
  '200-plus': ['$$$', '$$$$'],
  'flexible': ['$', '$$', '$$$', '$$$$'],
};

const VIBE_TO_TAG: Record<VibeChoice, string[]> = {
  'impressive': ['Impress Them', 'Romantic', 'Date Night'],
  'intimate': ['Romantic', 'Late Night', 'Date Night'],
  'low-pressure': ['First Date', 'Coffee Date', 'Casual'],
  'classic-romantic': ['Romantic', 'Date Night', 'Impress Them'],
  'adventurous': ['Activity', 'Late Night', 'Casual'],
  'something-else': ['Romantic', 'Date Night', 'Casual'],
};

const SHAPE_TO_SLOTS: Record<Shape, ('before' | 'main' | 'after')[]> = {
  'dinner-only': ['main'],
  'drinks-and-dinner': ['before', 'main'],
  'full-night': ['before', 'main', 'after'],
};

function priceMidpoint(p: string): number {
  return ({ '$': 25, '$$': 50, '$$$': 85, '$$$$': 140 } as Record<string, number>)[p] ?? 50;
}

function score(v: Venue, input: PlanInput, tiers?: RestaurantTierMap): number {
  let s = v.score ?? 7;
  const tagPrefs = VIBE_TO_TAG[input.vibe] || [];
  if (tagPrefs.includes(v.vibe)) s += 1.2;
  if ((BUDGET_TO_PRICE[input.budget] || []).includes(v.price)) s += 0.6;
  if (input.neighborhood && slugify(v.neighborhood) === slugify(input.neighborhood)) s += 2.0;
  const tier = tiers?.[v.slug];
  if (tier === 'restaurant_premium') s += 1.5;
  else if (tier === 'featured') s += 0.9;
  s += Math.random() * 0.5;
  return s;
}

function slotBoost(v: Venue, slot: 'before' | 'main' | 'after' | 'activity'): number {
  const vibe = v.vibe || '';
  if (slot === 'before') {
    if (/Coffee|Wine|Bar|Cocktail/i.test(vibe)) return 0.8;
  } else if (slot === 'after') {
    if (/Late Night|Bar|Cocktail|Dessert/i.test(vibe)) return 0.8;
  } else if (slot === 'main') {
    if (/Romantic|Impress|Date Night|Dinner/i.test(vibe)) return 0.5;
  } else if (slot === 'activity') {
    if (/Activity|Late Night/i.test(vibe)) return 0.6;
  }
  return 0;
}

function pickFor(
  slot: 'before' | 'main' | 'after' | 'activity',
  input: PlanInput,
  exclude: Set<string>,
  tiers?: RestaurantTierMap,
  excludeHistory?: Set<string>,
  cityOverride?: CitySlug
): Venue | null {
  const city = cityOverride || input.city;
  const allowedPrices = new Set(BUDGET_TO_PRICE[input.budget] || ['$', '$$', '$$$', '$$$$']);
  const baseFilter = (v: Venue) => {
    if (v.city !== city) return false;
    if (exclude.has(v.slug)) return false;
    if (excludeHistory?.has(v.slug)) return false;
    return true;
  };
  // Strict: within budget AND correct slot fit.
  const strictPool = VENUES.filter((v) => baseFilter(v) && allowedPrices.has(v.price));
  // Fallback pool: budget-only, in case slot boost wipes out options.
  const softPool = strictPool.length > 0 ? strictPool : VENUES.filter(baseFilter);
  const ranked = softPool
    .map((v) => ({ v, s: score(v, input, tiers) + slotBoost(v, slot) }))
    .sort((a, b) => b.s - a.s);
  return ranked[0]?.v ?? null;
}

function bookingFor(v: Venue): { url: string; provider: 'resy' | 'opentable' | 'walk-in' } {
  // Honest fallback: we don't have per-venue Resy/OpenTable URLs yet, so we
  // search Google for "<name> <neighborhood> reservation" which surfaces
  // whichever platform (Resy, OpenTable, Tock, direct) actually hosts it.
  if (v.price === '$') {
    return {
      url: `https://www.google.com/maps/search/${encodeURIComponent(v.name + ' ' + v.neighborhood)}`,
      provider: 'walk-in',
    };
  }
  const q = encodeURIComponent(`${v.name} ${v.neighborhood} reservation`);
  return {
    url: `https://www.google.com/search?q=${q}`,
    provider: 'resy', // kept for type-compat; UI label is now "Find a table"
  };
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
  const slots = [...SHAPE_TO_SLOTS[input.shape]];
  const used = new Set<string>();
  const historySet = new Set(excludeHistory || []);
  const stops: Stop[] = [];

  // Base start: 7:00pm for dinner, 6:30pm if drinks-first, flexible with date_at
  let cursor = input.shape === 'full-night' ? '18:30' : '19:00';
  if (input.dateAt) {
    const d = new Date(input.dateAt);
    if (!isNaN(d.getTime())) {
      cursor = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
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
    cursor = timeMath(cursor, dur + 10);
  }

  // Optional DC-only activity add-on
  if (input.activity && input.activity !== 'none' && input.city === 'dc') {
    const v = pickFor('activity', input, used, tiers, historySet);
    if (v) {
      used.add(v.slug);
      const booking = bookingFor(v);
      stops.push({
        slot: 'activity',
        startTime: cursor,
        durationMin: 60,
        venue: v,
        bookingUrl: booking.url,
        bookingProvider: booking.provider,
      });
      cursor = timeMath(cursor, 70);
    }
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

// ------------------------------------------------------------
// Legacy adapter — accept old `{situation, vibe, activity, budget}` input
// and coerce to the new 6-question shape so nothing breaks.
// ------------------------------------------------------------
export function normalizeLegacyInput(raw: any): PlanInput {
  if (raw.occasion && raw.shape && raw.city) return raw as PlanInput;

  const citySlug: CitySlug =
    (['dc', 'nyc', 'atlanta', 'miami', 'philly'].includes(raw.city) ? raw.city : 'dc') as CitySlug;

  const occasionMap: Record<string, Occasion> = {
    'first-date': 'first-date',
    'second-date': 'early-dates',
    'anniversary': 'special',
    'casual-hang': 'regular',
    'make-it-up': 'special',
  };
  const vibeMap: Record<string, VibeChoice> = {
    'low-pressure': 'low-pressure',
    'romantic': 'classic-romantic',
    'fun-playful': 'adventurous',
    'impressive': 'impressive',
    'sexy': 'intimate',
  };
  const shapeMap: Record<string, Shape> = {
    'dinner': 'dinner-only',
    'drinks-only': 'drinks-and-dinner',
    'coffee': 'dinner-only',
    'activity': 'full-night',
    'full-evening': 'full-night',
  };
  const budgetMap: Record<string, Budget> = {
    'under-30': 'under-60',
    '30-60': 'under-60',
    '60-100': '60-120',
    'no-limit': '200-plus',
  };

  return {
    city: citySlug,
    when: raw.dateAt ? raw.dateAt : 'this-weekend',
    dateAt: raw.dateAt,
    occasion: occasionMap[raw.situation || ''] || 'early-dates',
    vibe: vibeMap[raw.vibe || ''] || 'classic-romantic',
    shape: shapeMap[raw.activity || ''] || 'drinks-and-dinner',
    budget: budgetMap[raw.budget || ''] || '60-120',
    activity: 'none',
    neighborhood: raw.neighborhood,
    freeText: raw.freeText,
  };
}
