import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const { shareId, vibe, notes } = await req.json().catch(() => ({} as any));
  if (!shareId) return NextResponse.json({ error: 'missing shareId' }, { status: 400 });

  const svc = createServiceClient();
  const { data: plan } = await svc.from('plans').select('id, user_id').eq('share_id', shareId).single();
  if (!plan || plan.user_id !== userRes.user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await svc
    .from('plans')
    .update({ debrief_response: { vibe, notes, submittedAt: new Date().toISOString() } })
    .eq('id', plan.id);

  // Naive preference learning: append note keywords to profile.preferences
  const { data: profile } = await svc.from('profiles').select('preferences').eq('id', userRes.user.id).single();
  const prefs = (profile?.preferences as any) || {};
  prefs.debriefs = prefs.debriefs || [];
  prefs.debriefs.push({ shareId, vibe, notes, ts: new Date().toISOString() });
  await svc.from('profiles').update({ preferences: prefs }).eq('id', userRes.user.id);

  return NextResponse.json({ ok: true });
}
