import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { extractIp, hashIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email', message: 'Enter a valid email address.' }, { status: 400 });
  }

  const svc = createServiceClient();
  const ip = extractIp(req);
  const ip_hash = hashIp(ip);

  const { data: existing } = await svc
    .from('email_captures')
    .select('id, plans_used, converted_user_id')
    .ilike('email', email)
    .maybeSingle();

  if (existing?.converted_user_id) {
    return NextResponse.json({
      ok: true,
      alreadyConverted: true,
      message: 'You already have an account. Log in to keep planning.',
    });
  }

  if (!existing) {
    await svc.from('email_captures').insert({
      email,
      ip_hash,
      source: body.source || 'email_wall',
      marketing_opt_in: body.marketingOptIn !== false,
      plans_used: 0,
    });
  }

  return NextResponse.json({ ok: true });
}
