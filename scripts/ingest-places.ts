/**
 * Google Places ingest — pulls date-worthy venues for NYC / Atlanta / Miami / Philly.
 * Filters: 4.0+ rating, operational, restaurant/bar/cafe primary type.
 * Dedupes against existing venues.json. Writes raw rows only — editorial content
 * (scores, hook, desc, vibe, convo/vibe labels) is generated in Script 3.
 */
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) { console.error('Missing GOOGLE_PLACES_API_KEY'); process.exit(1); }

type Target = {
  city: 'nyc' | 'atlanta' | 'miami' | 'philly';
  neighborhoods: { name: string; lat: number; lng: number }[];
};

// Lat/lng anchors for each dating neighborhood — used as the bias center for a search.
const TARGETS: Target[] = [
  {
    city: 'nyc',
    neighborhoods: [
      { name: 'West Village',       lat: 40.7336, lng: -74.0027 },
      { name: 'East Village',       lat: 40.7281, lng: -73.9819 },
      { name: 'Lower East Side',    lat: 40.7145, lng: -73.9845 },
      { name: 'Williamsburg',       lat: 40.7081, lng: -73.9571 },
      { name: 'SoHo',               lat: 40.7233, lng: -74.0030 },
      { name: 'Nolita',             lat: 40.7223, lng: -73.9954 },
      { name: 'Greenwich Village',  lat: 40.7335, lng: -74.0027 },
      { name: 'Chelsea',            lat: 40.7465, lng: -74.0014 },
      { name: 'DUMBO',              lat: 40.7033, lng: -73.9881 },
      { name: 'Fort Greene',        lat: 40.6891, lng: -73.9742 },
      { name: 'Upper West Side',    lat: 40.7870, lng: -73.9754 },
      { name: 'Harlem',             lat: 40.8116, lng: -73.9465 },
    ],
  },
  {
    city: 'atlanta',
    neighborhoods: [
      { name: 'Buckhead',           lat: 33.8380, lng: -84.3785 },
      { name: 'Midtown',            lat: 33.7838, lng: -84.3830 },
      { name: 'Old Fourth Ward',    lat: 33.7666, lng: -84.3699 },
      { name: 'Inman Park',         lat: 33.7586, lng: -84.3521 },
      { name: 'West Midtown',       lat: 33.7887, lng: -84.4128 },
      { name: 'Poncey-Highland',    lat: 33.7728, lng: -84.3517 },
      { name: 'Virginia-Highland',  lat: 33.7832, lng: -84.3526 },
      { name: 'East Atlanta Village', lat: 33.7422, lng: -84.3377 },
      { name: 'Decatur',            lat: 33.7748, lng: -84.2963 },
      { name: 'Westside',           lat: 33.7887, lng: -84.4128 },
    ],
  },
  {
    city: 'miami',
    neighborhoods: [
      { name: 'Wynwood',            lat: 25.8010, lng: -80.1993 },
      { name: 'Brickell',           lat: 25.7617, lng: -80.1918 },
      { name: 'South Beach',        lat: 25.7825, lng: -80.1340 },
      { name: 'Design District',    lat: 25.8133, lng: -80.1918 },
      { name: 'Coconut Grove',      lat: 25.7282, lng: -80.2434 },
      { name: 'Coral Gables',       lat: 25.7215, lng: -80.2683 },
      { name: 'Little Havana',      lat: 25.7653, lng: -80.2194 },
      { name: 'Edgewater',          lat: 25.7966, lng: -80.1893 },
      { name: 'Midtown Miami',      lat: 25.8127, lng: -80.1934 },
      { name: 'Key Biscayne',       lat: 25.6932, lng: -80.1625 },
    ],
  },
  {
    city: 'philly',
    neighborhoods: [
      { name: 'Rittenhouse Square', lat: 39.9490, lng: -75.1719 },
      { name: 'Old City',           lat: 39.9516, lng: -75.1437 },
      { name: 'Fishtown',           lat: 39.9720, lng: -75.1330 },
      { name: 'Northern Liberties', lat: 39.9633, lng: -75.1402 },
      { name: 'East Passyunk',      lat: 39.9304, lng: -75.1643 },
      { name: 'Center City',        lat: 39.9526, lng: -75.1652 },
      { name: 'University City',    lat: 39.9522, lng: -75.1932 },
      { name: 'Queen Village',      lat: 39.9413, lng: -75.1469 },
      { name: 'Graduate Hospital',  lat: 39.9398, lng: -75.1759 },
      { name: 'Manayunk',           lat: 40.0246, lng: -75.2171 },
    ],
  },
];

// Search query templates — ordered from "premium date" to "casual date"
const QUERIES = [
  'romantic restaurants',
  'cocktail bars',
  'wine bars',
  'upscale dinner',
  'date night restaurants',
  'rooftop restaurants',
  'speakeasy',
  'tasting menu',
];

type Place = {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  vicinity?: string;
  formatted_address?: string;
  business_status?: string;
  types?: string[];
  geometry?: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string }[];
};

const EXCLUDE_CHAIN_TERMS = [
  'mcdonald', "wendy's", 'burger king', 'taco bell', 'subway', 'chipotle',
  'panera', 'starbucks', 'dunkin', 'domino', 'pizza hut', 'papa john',
  'olive garden', 'applebee', 'chili\'s', 'ihop', 'cheesecake factory',
  'outback', 'tgi friday', 'red lobster',
];

function isChain(name: string): boolean {
  const lc = name.toLowerCase();
  return EXCLUDE_CHAIN_TERMS.some((t) => lc.includes(t));
}

function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function priceFromLevel(lvl?: number): string {
  if (lvl == null) return '$$';
  if (lvl >= 4) return '$$$$';
  if (lvl === 3) return '$$$';
  if (lvl === 2) return '$$';
  return '$';
}

async function searchNearby(query: string, lat: number, lng: number, radiusMeters = 1000): Promise<Place[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('key', API_KEY!);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    console.warn('    Places API:', json.status, json.error_message || '');
    return [];
  }
  return (json.results || []) as Place[];
}

function photoUrl(ref: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${ref}&key=${API_KEY}`;
}

async function main() {
  const venuesPath = path.join(process.cwd(), 'data/venues.json');
  const existing = JSON.parse(fs.readFileSync(venuesPath, 'utf8')) as any[];
  const existingByPlace = new Map(existing.filter((v) => v.place_id).map((v) => [v.place_id, v]));
  const existingSlugs = new Set(existing.map((v) => v.slug));

  const added: any[] = [];

  for (const target of TARGETS) {
    console.log(`\n=== ${target.city.toUpperCase()} ===`);
    const cityFound: Map<string, any> = new Map();

    for (const hood of target.neighborhoods) {
      for (const q of QUERIES) {
        if (cityFound.size >= 230) break; // aim for 200 after filter
        const results = await searchNearby(`${q} ${hood.name}`, hood.lat, hood.lng, 1500);
        for (const p of results) {
          if (!p.place_id || cityFound.has(p.place_id)) continue;
          if (existingByPlace.has(p.place_id)) continue;
          if ((p.rating || 0) < 4.0) continue;
          if ((p.user_ratings_total || 0) < 50) continue;
          if (p.business_status && p.business_status !== 'OPERATIONAL') continue;
          if (isChain(p.name)) continue;
          // Basic date-worthy type filter
          const types = p.types || [];
          const allowed = types.some((t) =>
            ['restaurant', 'bar', 'cafe', 'food', 'night_club', 'meal_takeaway'].includes(t)
          );
          if (!allowed) continue;
          if (types.includes('fast_food')) continue;

          let slug = slugify(p.name);
          let n = 2;
          while (existingSlugs.has(slug)) { slug = `${slugify(p.name)}-${n++}`; }
          existingSlugs.add(slug);

          cityFound.set(p.place_id, {
            slug,
            place_id: p.place_id,
            name: p.name,
            city: target.city,
            neighborhood: hood.name,
            price: priceFromLevel(p.price_level),
            vibe: null,           // filled by Script 3
            score: null,          // filled by Script 3
            hook: null,           // filled by Script 3
            desc: null,           // filled by Script 3
            photo: p.photos?.[0]?.photo_reference ? photoUrl(p.photos[0].photo_reference) : null,
            scores: { convo: null, vibe: null, exit: null },
            google: {
              rating: p.rating,
              total_ratings: p.user_ratings_total,
              address: p.formatted_address || p.vicinity,
              types: p.types,
              location: p.geometry?.location,
            },
          });
        }
        // Light rate limiting — Places API allows ~50 QPS; we stay well under
        await new Promise((r) => setTimeout(r, 120));
      }
      process.stdout.write(`  ${hood.name}: ${cityFound.size} total\r`);
    }
    console.log(`\n  ${target.city}: ${cityFound.size} venues pulled`);
    for (const v of cityFound.values()) added.push(v);
  }

  const merged = [...existing, ...added];
  fs.writeFileSync(venuesPath, JSON.stringify(merged, null, 2));
  console.log(`\nWrote ${added.length} new venues to data/venues.json (total: ${merged.length})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
