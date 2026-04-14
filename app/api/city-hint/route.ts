import { NextResponse } from 'next/server';
import { cityFromHeaders } from '@/lib/geo';

export const runtime = 'edge'; // cheap, fast, no DB
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const city = cityFromHeaders(req.headers);
  return NextResponse.json(
    { city: city || null },
    { headers: { 'cache-control': 'private, max-age=0, no-store' } }
  );
}
