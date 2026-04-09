import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

/**
 * POST: redeem a referral code. Both referrer and referred get +3 free plan uses.
 */
export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const { code } = await req.json().catch(() => ({} as any));
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'missing code' }, { status: 400 });
  }

  const svc = createServiceClient();

  // Look up referral
  const { data: ref } = await svc
    .from('referrals')
    .select('id, referrer_id, redeemed_by')
    .eq('code', code.toUpperCase())
    .single();

  if (!ref) {
    return NextResponse.json({ error: 'invalid_code', message: 'That referral code doesn\'t exist.' }, { status: 404 });
  }

  if (ref.referrer_id === userRes.user.id) {
    return NextResponse.json({ error: 'self_referral', message: 'You can\'t use your own referral code.' }, { status: 400 });
  }

  // Check if user already redeemed any code
  const { data: alreadyRedeemed } = await svc
    .from('referrals')
    .select('id')
    .contains('redeemed_by', [userRes.user.id])
    .limit(1);

  if (alreadyRedeemed && alreadyRedeemed.length > 0) {
    return NextResponse.json({ error: 'already_redeemed', message: 'You\'ve already used a referral code.' }, { status: 400 });
  }

  // Add redeemer to the list
  const redeemedBy = ref.redeemed_by || [];
  redeemedBy.push(userRes.user.id);
  await svc.from('referrals').update({ redeemed_by: redeemedBy }).eq('id', ref.id);

  // Grant +3 free plan uses to both parties
  const BONUS = 3;
  await svc.rpc('increment_plan_uses_bonus', { p_user_id: userRes.user.id, p_bonus: BONUS });
  await svc.rpc('increment_plan_uses_bonus', { p_user_id: ref.referrer_id, p_bonus: BONUS });

  return NextResponse.json({ ok: true, bonusPlans: BONUS });
}
