import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supa = createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const svc = createServiceClient();
  const { data: couple, error: fetchErr } = await svc
    .from('couples')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle();

  if (fetchErr || !couple) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  if (couple.partner_a === user.id) return NextResponse.json({ error: "That's your own invite link" }, { status: 400 });
  if (couple.partner_b) return NextResponse.json({ error: 'This couple is already active' }, { status: 400 });

  const { data: updated, error: updErr } = await svc
    .from('couples')
    .update({ partner_b: user.id, status: 'active', joined_at: new Date().toISOString(), invite_token: null })
    .eq('id', couple.id)
    .select()
    .single();

  if (updErr) return NextResponse.json({ error: 'Could not join' }, { status: 500 });
  return NextResponse.json({ couple: updated });
}
