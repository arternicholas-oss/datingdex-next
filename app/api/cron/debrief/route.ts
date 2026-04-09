import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Vercel cron hits this hourly. Sends one debrief email per plan whose
// date_at < now AND debrief_sent = false. Marks debrief_sent = true after.
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.CRON_SECRET || !auth.includes(process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, sent: 0, note: 'RESEND_API_KEY not set' });
  }

  const svc = createServiceClient();
  const cutoff = new Date(Date.now() - 12 * 3600 * 1000).toISOString(); // 12hrs after date

  const { data: plans } = await svc
    .from('plans')
    .select('id, share_id, user_id, itinerary')
    .eq('debrief_sent', false)
    .lt('date_at', cutoff)
    .not('user_id', 'is', null)
    .limit(50);

  if (!plans || plans.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const p of plans) {
    const { data: profile } = await svc.from('profiles').select('email, full_name').eq('id', p.user_id).single();
    if (!profile?.email) continue;
    const it: any = p.itinerary;
    const stops = it?.stops || [];
    const top = stops.map((s: any) => s.venue?.name).filter(Boolean).join(' → ');
    const debriefUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.datingdex.com'}/plan/${p.share_id}#debrief`;
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'DatingDex <hello@datingdex.com>',
        to: profile.email,
        subject: 'How\'d last night go?',
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
            <div style="color:#FF5C3A;font-weight:800;letter-spacing:1px;font-size:14px;">DATINGDEX</div>
            <h1 style="font-size:28px;margin:16px 0 8px;line-height:1.2;">How'd last night go?</h1>
            <p style="color:#444;line-height:1.5;">Your plan was: <strong>${top}</strong></p>
            <p style="color:#444;line-height:1.5;">15 seconds of feedback makes your next plan smarter. Tell us what worked, what didn't, and we'll learn your preferences.</p>
            <a href="${debriefUrl}" style="display:inline-block;background:#FF5C3A;color:#fff;padding:14px 24px;border-radius:999px;font-weight:700;text-decoration:none;margin-top:8px;">Share how it went →</a>
            <p style="margin-top:32px;color:#888;font-size:12px;">You're getting this because you built a date plan on DatingDex. <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account" style="color:#888;">Manage emails</a></p>
          </div>
        `,
      });
      await svc.from('plans').update({ debrief_sent: true }).eq('id', p.id);
      sent++;
    } catch (e) {
      console.error('debrief send failed', p.id, e);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
