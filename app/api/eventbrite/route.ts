import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Revalidate every hour
export const revalidate = 3600;

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_API_TOKEN;
const DC_LOCATION = '38.9072,-77.0369'; // DC coordinates
const RADIUS = '15mi';

type EventbriteEvent = {
  id: string;
  name: { text: string };
  description: { text: string } | null;
  url: string;
  start: { local: string; utc: string };
  end: { local: string; utc: string };
  logo: { url: string } | null;
  venue?: {
    name: string;
    address: { city: string; region: string; localized_area_display: string };
  };
  is_free: boolean;
  ticket_availability?: { minimum_ticket_price?: { major_value: string } };
};

export type EventbriteEventClean = {
  id: string;
  title: string;
  url: string;
  startLocal: string;
  endLocal: string;
  imageUrl: string | null;
  venueName: string | null;
  area: string | null;
  isFree: boolean;
  minPrice: string | null;
};

function cleanEvent(e: EventbriteEvent): EventbriteEventClean {
  return {
    id: e.id,
    title: e.name.text,
    url: e.url,
    startLocal: e.start.local,
    endLocal: e.end.local,
    imageUrl: e.logo?.url || null,
    venueName: e.venue?.name || null,
    area: e.venue?.address?.localized_area_display || null,
    isFree: e.is_free,
    minPrice: e.ticket_availability?.minimum_ticket_price?.major_value || null,
  };
}

export async function GET() {
  if (!EVENTBRITE_TOKEN) {
    // Return curated fallback when no API key
    return NextResponse.json({ events: [], note: 'EVENTBRITE_API_TOKEN not set' });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const params = new URLSearchParams({
      'location.latitude': '38.9072',
      'location.longitude': '-77.0369',
      'location.within': RADIUS,
      'start_date.range_start': `${today}T00:00:00`,
      'start_date.range_end': `${tomorrow}T23:59:59`,
      'categories': '110,113,105', // Food & Drink, Music, Art
      'sort_by': 'date',
      'expand': 'venue,ticket_availability',
    });

    const res = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${EVENTBRITE_TOKEN}` },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.error('Eventbrite API error', res.status);
      return NextResponse.json({ events: [] });
    }

    const data = await res.json();
    const events = (data.events || [])
      .slice(0, 8)
      .map((e: EventbriteEvent) => cleanEvent(e));

    return NextResponse.json({ events });
  } catch (e) {
    console.error('Eventbrite fetch failed', e);
    return NextResponse.json({ events: [] });
  }
}
