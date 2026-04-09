import { NextResponse } from 'next/server';
import { buildItinerary, type PlanInput } from '@/lib/planner';
import { parseFreeText, writeBlurbs } from '@/lib/anthropic';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_LIMIT = 3;

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const supabase = createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  // Logged-out users: see the wizard but never get a real result
  if (!user) {
    return NextResponse.json(
      { error: 'auth_required', message: 'Sign up to see your plan. It only takes 20 seconds.' },
      { status: 401 }
    );
  }

  // Check tier + usage
  const svc = createServiceClient();
  const { data: profile } = await svc.from('profiles').select('*').eq('id', user.id).single();
  const tier = profile?.tier ?? 'free';
  const uses = profile?.plan_uses_count ?? 0;
  const isPremium = tier === 'premium' || tier === 'annual';

  if (!isPremium && uses >= FREE_LIMIT) {
    return NextResponse.json(
      { error: 'paywall', message: 'Free plan limit reached. Upgrade to Premium for unlimited plans.', uses, limit: FREE_LIMIT },
      { status: 402 }
    );
  }

  // Build PlanInput from body, optionally augmented by Claude NL parsing
  let input: PlanInput = {
    city: body.city || 'Washington, DC',
    situation: body.situation || 'first-date',
    vibe: body.vibe || 'romantic',
    activity: body.activity || 'dinner',
    budget: body.budget || '30-60',
    dateAt: body.dateAt,
    freeText: body.freeText,
  };
  if (body.freeText && typeof body.freeText === 'string' && body.freeText.trim()) {
    try {
      const parsed = await parseFreeText(body.freeText);
      input = { ...input, ...parsed };
    } catch (e) {
      console.error('parseFreeText failed', e);
    }
  }

  // Load restaurant tier map (paying restaurants get a planner boost)
  const { data: paying } = await svc
    .from('restaurants')
    .select('venue_slug, tier')
    .in('tier', ['featured', 'restaurant_premium']);
  const tierMap: Record<string, 'featured' | 'restaurant_premium'> = {};
  for (const r of paying || []) {
    tierMap[r.venue_slug] = r.tier as any;
  }

  const itinerary = buildItinerary(input, tierMap);
  let blurbs: string[] = [];
  let shareBlurb = itinerary.stops.map((s) => s.venue.name).join(' → ');
  try {
    const r = await writeBlurbs(itinerary);
    blurbs = r.blurbs;
    shareBlurb = r.shareBlurb;
  } catch (e) {
    console.error('writeBlurbs failed', e);
  }
  itinerary.stops = itinerary.stops.map((s, i) => ({ ...s, blurb: blurbs[i] || `${s.venue.hook}. ${s.venue.desc}` }));

  // Persist
  const { data: inserted, error: insErr } = await svc
    .from('plans')
    .insert({
      user_id: user.id,
      city: input.city,
      situation: input.situation,
      vibe: input.vibe,
      activity: input.activity,
      budget: input.budget,
      natural_language: input.freeText || null,
      date_at: input.dateAt || null,
      itinerary,
      share_blurb: shareBlurb,
      is_public: true,
    })
    .select('id, share_id')
    .single();

  if (insErr) {
    console.error('plan insert failed', insErr);
    return NextResponse.json({ error: 'db', message: 'Could not save plan.' }, { status: 500 });
  }

  // Increment usage if not premium
  if (!isPremium) {
    await svc.rpc('increment_plan_uses', { p_user_id: user.id });
  }

  return NextResponse.json({
    ok: true,
    shareId: inserted.share_id,
    itinerary,
    shareBlurb,
    usesRemaining: isPremium ? null : Math.max(0, FREE_LIMIT - (uses + 1)),
  });
}
