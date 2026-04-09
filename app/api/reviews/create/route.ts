import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';
import { rateLimitReview } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supa = createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  // Rate limit: 10 reviews/day
  const rl = rateLimitReview(user.id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Too many reviews today. Try again tomorrow.' },
      { status: 429 }
    );
  }

  const { venue_slug, rating, quote, plan_id } = await req.json().catch(() => ({} as any));
  if (!venue_slug || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from('reviews')
    .insert({
      user_id: user.id,
      venue_slug,
      plan_id: plan_id || null,
      rating,
      quote: (quote || '').slice(0, 300),
      published: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, review: data });
}
