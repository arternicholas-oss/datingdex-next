import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Weekly cron: runs every Thursday at 2pm ET (18:00 UTC).
 * Sends a playful nudge to users who haven't planned a date this week.
 * Only targets users who've used the planner at least once (they know what it is).
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

  // Find users who:
  // 1. Have used the planner at least once (plan_uses_count > 0)
  // 2. Haven't generated a plan in the last 5 days
  // 3. Haven't opted out of emails (email_opt_out != true)
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();

  // Get users who have planned before
  const { data: activeUsers } = await svc
    .from('profiles')
    .select('id, email, full_name, tier')
    .gt('plan_uses_count', 0)
    .neq('email_opt_out', true)
    .not('email', 'is', null)
    .limit(200);

  if (!activeUsers || activeUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Filter out users who've planned recently
  const userIds = activeUsers.map((u) => u.id);
  const { data: recentPlanners } = await svc
    .from('plans')
    .select('user_id')
    .in('user_id', userIds)
    .gte('created_at', fiveDaysAgo);

  const recentIds = new Set((recentPlanners || []).map((p) => p.user_id));
  const targets = activeUsers.filter((u) => !recentIds.has(u.id));

  let sent = 0;
  const subjects = [
    "It's Thursday. You still don't have a plan.",
    "Your weekend date is unplanned. Fix that?",
    "30 seconds to a perfect Saturday night.",
    "Your partner deserves better than Netflix again.",
    "Thursday check-in: where are you taking them?",
  ];

  for (const user of targets) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const isPro = user.tier === 'premium' || user.tier === 'annual';
    const firstName = user.full_name?.split(' ')[0] || 'Hey';
    const planUrl = `${siteUrl}/plan?utm_source=reminder&utm_medium=email`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'DatingDex <hello@datingdex.com>',
        to: user.email,
        subject,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
            <div style="color:#FF5C3A;font-weight:800;letter-spacing:1px;font-size:14px;">DATINGDEX</div>
            <h1 style="font-size:28px;margin:16px 0 8px;line-height:1.2;">${subject}</h1>
            <p style="color:#444;line-height:1.6;font-size:16px;">
              ${firstName}, the weekend is almost here and you haven't planned anything yet.
              We get it — picking a spot is weirdly stressful.
            </p>
            <p style="color:#444;line-height:1.6;font-size:16px;">
              That's literally why we exist. Tell us the vibe, and we'll build your whole night in 30 seconds —
              where to go, when to arrive, what to order${isPro ? ', what to wear, and what to talk about' : ''}.
            </p>
            <a href="${planUrl}" style="display:inline-block;background:#FF5C3A;color:#fff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none;margin-top:12px;font-size:16px;">Plan this weekend's date →</a>
            ${!isPro ? `
            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-top:24px;">
              <p style="margin:0 0 4px;color:#92400e;font-weight:700;font-size:14px;">Go Pro — never run out of plans</p>
              <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">Unlimited plans + Date Copilot tells you what to wear, gives you conversation starters, and writes the follow-up text. <a href="${siteUrl}/premium?utm_source=reminder" style="color:#92400e;font-weight:700;">$12/mo →</a></p>
            </div>` : ''}
            <p style="margin-top:32px;color:#888;font-size:12px;">You're getting this because you've planned a date on DatingDex before. <a href="${siteUrl}/account" style="color:#888;">Unsubscribe</a></p>
          </div>
        `,
      });
      sent++;
    } catch (e) {
      console.error('date-reminder send failed', user.id, e);
    }
  }

  return NextResponse.json({ ok: true, sent, total: targets.length });
}
