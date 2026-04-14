import { NextResponse } from 'next/server';
import { buildItinerary, normalizeLegacyInput, type PlanInput, type PlanPayload } from '@/lib/planner';
import { parseFreeText, writeFullPlan, validateVenues } from '@/lib/anthropic';
import { dedupeLeadingSentence } from '@/lib/format';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';
import { extractIp, hashIp, rateLimitPlan, FREE_PLAN_LIMITS } from '@/lib/rate-limit';
import { getWeather } from '@/lib/weather';
import { getPlaylistForVibe } from '@/lib/playlists';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Tier = 'anon' | 'email' | 'signed' | 'premium';

// Compute timing sheet from the itinerary
function buildTimingSheet(input: PlanInput, firstStopStart: string) {
  const [h, m] = firstStopStart.split(':').map(Number);
  const total = h * 60 + m;
  const rideMin = 12; // default assumption; we could refine with lat/lon later
  const buffer = 5;
  const leaveTotal = total - rideMin - buffer;
  const leaveBy = `${String(Math.floor(leaveTotal / 60) % 24).padStart(2, '0')}:${String(leaveTotal % 60).padStart(2, '0')}`;
  return {
    leaveBy,
    arriveBy: firstStopStart,
    rideEstimateMin: rideMin,
    reservationHoldMin: 15,
  };
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const supabase = createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  const svc = createServiceClient();

  // Resolve tier
  let tier: Tier = 'anon';
  let profile: any = null;
  if (user) {
    profile = (await svc.from('profiles').select('*').eq('id', user.id).single()).data;
    const userTier = profile?.tier ?? 'free';
    tier = userTier === 'premium' || userTier === 'annual' ? 'premium' : 'signed';
  } else if (body.capturedEmail && typeof body.capturedEmail === 'string') {
    tier = 'email';
  }

  const ip = extractIp(req);
  const ip_hash = hashIp(ip);

  // Burst guard
  const burstKey = user ? user.id : ip_hash;
  const burst = rateLimitPlan(burstKey);
  if (!burst.allowed) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Too many plans. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((burst.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Persistent tier enforcement
  if (tier === 'anon') {
    const { data: row } = await svc
      .from('anonymous_plan_counts')
      .select('count')
      .eq('ip_hash', ip_hash)
      .maybeSingle();
    const count = row?.count ?? 0;
    if (count >= FREE_PLAN_LIMITS.anon) {
      return NextResponse.json(
        {
          error: 'email_wall',
          message: 'Enter your email for one more free plan.',
          nextTier: 'email',
        },
        { status: 402 }
      );
    }
  } else if (tier === 'email') {
    const email = String(body.capturedEmail).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'invalid_email', message: 'Enter a valid email address.' }, { status: 400 });
    }
    // Ensure capture row exists (idempotent)
    const { data: existing } = await svc
      .from('email_captures')
      .select('id, plans_used, converted_user_id')
      .ilike('email', email)
      .maybeSingle();
    if (!existing) {
      await svc.from('email_captures').insert({
        email,
        ip_hash,
        plans_used: 0,
        source: 'email_wall',
      });
    } else if (existing.converted_user_id) {
      // Already converted; user should log in
      return NextResponse.json(
        { error: 'already_converted', message: 'You already have an account. Log in to keep planning.' },
        { status: 409 }
      );
    } else if ((existing.plans_used ?? 0) >= FREE_PLAN_LIMITS.email) {
      return NextResponse.json(
        { error: 'signup_wall', message: 'Create a free account for one more plan, then pick a plan.', nextTier: 'signed' },
        { status: 402 }
      );
    }
  } else if (tier === 'signed') {
    const uses = profile?.plan_uses_count ?? 0;
    if (uses >= FREE_PLAN_LIMITS.signed) {
      return NextResponse.json(
        { error: 'paywall', message: 'You\u2019ve used your free plan. Upgrade for unlimited plans and every feature.', uses, limit: FREE_PLAN_LIMITS.signed },
        { status: 402 }
      );
    }
  }

  // Build structured input (accept both new and legacy shape)
  let input: PlanInput = normalizeLegacyInput(body);
  const freeText = body.freeText || body.occasionNote || body.vibeNote;
  if (freeText && typeof freeText === 'string' && freeText.trim()) {
    try {
      const parsed = await parseFreeText(freeText);
      input = { ...input, ...parsed };
    } catch (e) {
      console.error('parseFreeText failed', e);
    }
  }

  // Restaurant tier map (paying restaurants get planner boost)
  const { data: paying } = await svc
    .from('restaurants')
    .select('venue_slug, tier')
    .in('tier', ['featured', 'restaurant_premium']);
  const tierMap: Record<string, 'featured' | 'restaurant_premium'> = {};
  for (const r of paying || []) {
    tierMap[r.venue_slug] = r.tier as any;
  }

  // History (authed only)
  let dateHistory: string[] = [];
  if (user) {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
    const { data: recentPlans } = await svc
      .from('plans')
      .select('itinerary')
      .eq('user_id', user.id)
      .gte('created_at', sixtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(10);
    for (const p of recentPlans || []) {
      const it: any = p.itinerary;
      if (it?.stops) for (const s of it.stops) if (s.venue?.slug) dateHistory.push(s.venue.slug);
    }
    dateHistory = [...new Set(dateHistory)];
  }

  const rawItinerary = buildItinerary(input, tierMap, dateHistory);
  let itinerary = validateVenues(rawItinerary);

  if (itinerary.stops.length === 0) {
    return NextResponse.json(
      { error: 'no_match', message: 'No venues matched. Try a different neighborhood or broader budget.' },
      { status: 422 }
    );
  }

  // Parallel fetch: weather + playlist (playlist is sync, but shape matches)
  const weather = await getWeather(input.city, input.dateAt).catch(() => null);
  const playlist = getPlaylistForVibe(input.vibe);

  // Claude: write rich output
  let full: Awaited<ReturnType<typeof writeFullPlan>>;
  try {
    full = await writeFullPlan(itinerary, {
      dateHistory,
      weatherContext: weather ? { forecast: weather.description, tempF: weather.tempF } : undefined,
      isPremium: tier === 'premium',
    });
  } catch (e) {
    console.error('writeFullPlan failed', e);
    // Still return the bare itinerary with fallbacks
    full = await writeFullPlan(itinerary, { dateHistory }); // will use fallback branch if no key
  }

  // Stitch full into itinerary stops
  itinerary.stops = itinerary.stops.map((s, i) => {
    const rawBlurb = full.blurbs[i] || `${s.venue.hook}. ${s.venue.desc}`;
    return {
      ...s,
      blurb: dedupeLeadingSentence(rawBlurb),
      beats: full.beats[i],
      walkTo: i < itinerary.stops.length - 1 ? full.walkTransitions[i] : undefined,
      whatToWear: full.whatToWear[i],
      photoSpot: full.photoSpots[i],
    };
  });

  itinerary.dressCode = full.whatToWear[0];

  const payload: PlanPayload = {
    coldOpen: full.coldOpen,
    nightAtAGlance: full.nightAtAGlance,
    producersNote: full.producersNote,
    bailoutLine: full.bailoutLine || undefined,
    extendLine: full.extendLine,
    postDateText: full.postDateText,
    timingSheet: buildTimingSheet(input, itinerary.stops[0].startTime),
    weather: weather
      ? { forecast: weather.description, tempF: weather.tempF, note: weather.note }
      : undefined,
    playlist: { name: playlist.name, url: playlist.url, note: playlist.note },
    paymentNote: full.paymentNote,
  };
  itinerary.payload = payload;

  // Persist
  let shareId: string | null = null;
  const anonEmail = tier === 'email' ? String(body.capturedEmail).toLowerCase() : null;

  const { data: inserted, error: insErr } = await svc
    .from('plans')
    .insert({
      user_id: user?.id ?? null,
      anon_email: anonEmail,
      ip_hash,
      city: input.city,
      city_slug: input.city,
      situation: input.occasion,
      vibe: input.vibe,
      activity: input.shape,
      budget: input.budget,
      natural_language: input.freeText || null,
      date_at: input.dateAt || null,
      itinerary,
      plan_payload: payload,
      share_blurb: full.shareBlurb,
      weather: weather ? (weather as any) : null,
      playlist_url: playlist.url,
      is_public: true,
      version: 3,
    })
    .select('id, share_id')
    .single();

  if (insErr || !inserted) {
    console.error('plan insert failed', insErr);
    return NextResponse.json({ error: 'db', message: 'Could not save plan.' }, { status: 500 });
  }
  shareId = inserted.share_id;

  // Increment appropriate counter
  if (tier === 'anon') {
    await svc.rpc('increment_anon_plan_count', { p_ip_hash: ip_hash });
  } else if (tier === 'email' && anonEmail) {
    await svc.rpc('increment_email_capture_plans', { p_email: anonEmail });
  } else if (tier === 'signed' && user) {
    await svc.rpc('increment_plan_uses', { p_user_id: user.id });
  }

  // usesRemaining for UI
  let usesRemaining: number | null = null;
  let nextWall: 'email' | 'signup' | 'paywall' | null = null;
  if (tier === 'anon') { usesRemaining = 0; nextWall = 'email'; }
  else if (tier === 'email') { usesRemaining = 0; nextWall = 'signup'; }
  else if (tier === 'signed') {
    const uses = (profile?.plan_uses_count ?? 0) + 1;
    usesRemaining = Math.max(0, FREE_PLAN_LIMITS.signed - uses);
    if (usesRemaining === 0) nextWall = 'paywall';
  } else {
    usesRemaining = null;
  }

  return NextResponse.json({
    ok: true,
    tier,
    shareId,
    itinerary,
    payload,
    shareBlurb: full.shareBlurb,
    usesRemaining,
    nextWall,
    upsellMessage:
      tier === 'anon'
        ? 'That\u2019s your free plan. Drop an email for one more, then sign up for one more after that.'
        : tier === 'email'
          ? 'Create a free account to save this plan and unlock one more free plan.'
          : undefined,
  });
}
