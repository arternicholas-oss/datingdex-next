import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * GET: returns or creates the user's referral code
 */
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const svc = createServiceClient();
  const { data: existing } = await svc
    .from('referrals')
    .select('code')
    .eq('referrer_id', userRes.user.id)
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ code: existing.code });
  }

  // Generate unique 8-char referral code
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  await svc.from('referrals').insert({
    referrer_id: userRes.user.id,
    code,
  });

  return NextResponse.json({ code });
}
