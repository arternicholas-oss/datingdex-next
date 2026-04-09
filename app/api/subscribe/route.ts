import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const supa = createServiceClient();
    const { error } = await supa
      .from('email_subscribers')
      .upsert({ email: email.toLowerCase().trim(), source: source || 'unknown' }, { onConflict: 'email' });
    if (error) {
      console.error('subscribe error', error);
      return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
