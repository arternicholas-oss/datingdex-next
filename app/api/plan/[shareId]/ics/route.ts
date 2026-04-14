import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fmtICS(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function escape(s: string): string {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export async function GET(_req: Request, { params }: { params: { shareId: string } }) {
  const svc = createServiceClient();
  const { data: plan } = await svc
    .from('plans')
    .select('share_id, city, date_at, itinerary, plan_payload, share_blurb')
    .eq('share_id', params.shareId)
    .single();

  if (!plan) return new NextResponse('Not found', { status: 404 });

  const it: any = plan.itinerary;
  const stops: any[] = it?.stops || [];
  if (stops.length === 0) return new NextResponse('Empty plan', { status: 422 });

  // Base date \u2014 use plan.date_at if present, else next Friday
  let base: Date;
  if (plan.date_at) {
    base = new Date(plan.date_at);
    if (isNaN(base.getTime())) base = new Date();
  } else {
    base = new Date();
    const addDays = (5 - base.getDay() + 7) % 7 || 7;
    base.setDate(base.getDate() + addDays);
  }

  const dtStamp = fmtICS(new Date());

  const events = stops.map((s: any, i: number) => {
    const [h, m] = String(s.startTime || '19:00').split(':').map((x: string) => parseInt(x, 10));
    const start = new Date(base);
    start.setHours(h || 19, m || 0, 0, 0);
    const end = new Date(start.getTime() + (s.durationMin || 60) * 60000);
    const title = `${s.venue?.name || 'Stop'} (${s.slot || 'main'})`;
    const desc = [
      s.blurb || '',
      s.beats?.orderFirst ? `Order first: ${s.beats.orderFirst}` : '',
      s.beats?.insiderTip ? `Insider: ${s.beats.insiderTip}` : '',
      s.bookingUrl ? `Booking: ${s.bookingUrl}` : '',
    ].filter(Boolean).join('\n\n');
    const loc = `${s.venue?.name || ''}, ${s.venue?.neighborhood || ''}`;

    return [
      'BEGIN:VEVENT',
      `UID:${params.shareId}-${i}@datingdex.com`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${fmtICS(start)}`,
      `DTEND:${fmtICS(end)}`,
      `SUMMARY:${escape(title)}`,
      `DESCRIPTION:${escape(desc)}`,
      `LOCATION:${escape(loc)}`,
      s.bookingUrl ? `URL:${s.bookingUrl}` : '',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DatingDex//Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="datingdex-${params.shareId}.ics"`,
      'cache-control': 'no-store',
    },
  });
}
