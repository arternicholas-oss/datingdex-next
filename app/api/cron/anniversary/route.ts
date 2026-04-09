import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily cron: finds couples with anniversary in the next 7 days,
 * emails both partners a surprise plan suggestion.
 * Vercel cron config: 0 10 * * * (10am UTC daily)
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.CRON_SECRET || !auth.includes(process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, sent: 0, note: 'RESEND_API_KEY not set' });
  }

  const svc = createServiceClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.datingdex.com';

  // Find couples with anniversary in the next 7 days
  // We compare month+day regardless of year
  const now = new Date();
  const dates: string[] = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    // Format as MM-DD for comparison
    dates.push(
      `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }

  // Query couples where anniversary month-day matches upcoming 7 days
  const { data: couples } = await svc
    .from('couples')
    .select('id, partner_a, partner_b, anniversary_date, display_name')
    .eq('status', 'active')
    .not('anniversary_date', 'is', null);

  if (!couples || couples.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;

  for (const couple of couples) {
    if (!couple.anniversary_date) continue;
    const annDate = new Date(couple.anniversary_date);
    const annMmDd = `${String(annDate.getMonth() + 1).padStart(2, '0')}-${String(annDate.getDate()).padStart(2, '0')}`;

    if (!dates.includes(annMmDd)) continue;

    const daysUntil = dates.indexOf(annMmDd);
    const label = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
    const years = now.getFullYear() - annDate.getFullYear();
    const yearLabel = years > 0 ? ` (${years} year${years > 1 ? 's' : ''})` : '';

    // Get both partners' emails
    const partnerIds = [couple.partner_a, couple.partner_b].filter(Boolean);
    const { data: profiles } = await svc
      .from('profiles')
      .select('id, email, full_name')
      .in('id', partnerIds);

    if (!profiles) continue;

    for (const p of profiles) {
      if (!p.email) continue;
      const otherName = profiles.find((x: any) => x.id !== p.id)?.full_name || 'your partner';
      const planUrl = `${siteUrl}/plan?mode=impress`;

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'DatingDex <hello@datingdex.com>',
          to: p.email,
          subject: `Your anniversary is ${label}${yearLabel} 💕`,
          html: `
            <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
              <div style="color:#FF5C3A;font-weight:800;letter-spacing:1px;font-size:14px;">DATINGDEX</div>
              <h1 style="font-size:28px;margin:16px 0 8px;line-height:1.2;">Your anniversary is ${label}${yearLabel}</h1>
              <p style="color:#444;line-height:1.5;">Hey ${p.full_name || 'there'}, your anniversary with ${otherName} is coming up. We built you something.</p>
              <p style="color:#444;line-height:1.5;">Hit the button below and we'll choreograph the perfect anniversary night — where to go, what to order, what to say, and how to make it feel like the first date again.</p>
              <a href="${planUrl}" style="display:inline-block;background:#FF5C3A;color:#fff;padding:14px 24px;border-radius:999px;font-weight:700;text-decoration:none;margin-top:8px;">Plan our anniversary night →</a>
              <p style="margin-top:32px;color:#888;font-size:12px;">You're getting this because you set an anniversary date in Couples Mode on DatingDex. <a href="${siteUrl}/couples" style="color:#888;">Manage</a></p>
            </div>
          `,
        });
        sent++;
      } catch (e) {
        console.error('anniversary email failed', couple.id, p.id, e);
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
