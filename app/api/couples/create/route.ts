import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supa = createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { display_name, anniversary_date } = await req.json().catch(() => ({}));
  const token = crypto.randomBytes(16).toString('hex');

  const svc = createServiceClient();
  const { data, error } = await svc
    .from('couples')
    .insert({
      partner_a: user.id,
      invite_token: token,
      display_name: display_name || null,
      anniversary_date: anniversary_date || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('couple create', error);
    return NextResponse.json({ error: 'Could not create couple' }, { status: 500 });
  }
  return NextResponse.json({ couple: data });
}
