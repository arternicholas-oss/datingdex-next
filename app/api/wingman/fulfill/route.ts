import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildItinerary, normalizeLegacyInput, type PlanInput } from '@/lib/planner';
import { writeChoreography, validateVenues, parseFreeText } from '@/lib/anthropic';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fulfills a wingman gift: generates the date plan and emails it to the recipient.
 * Called by the Stripe webhook after payment completes.
 */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.CRON_SECRET || !auth.includes(process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { giftId } = await req.json().catch(() => ({} as any));
  if (!giftId) return NextResponse.json({ error: 'missing giftId' }, { status: 400 });

  const svc = createServiceClient();

  // Fetch the gift details
  const { data: gift } = await svc
    .from('wingman_gifts')
    .select('*')
    .eq('id', giftId)
    .single();

  if (!gift || gift.status !== 'paid') {
    return NextResponse.json({ error: 'gift not found or not paid' }, { status: 404 });
  }

  // Check if delivery should be scheduled for later
  if (gift.delivery_date) {
    const deliveryTime = new Date(gift.delivery_date + 'T14:00:00Z'); // 2pm UTC
    if (deliveryTime > new Date()) {
      // Schedule for later — mark as scheduled
      await svc.from('wingman_gifts').update({ status: 'scheduled' }).eq('id', giftId);
      return NextResponse.json({ ok: true, scheduled: true, deliverAt: deliveryTime.toISOString() });
    }
  }

  try {
    // Build the plan — wingman gifts are DC-only for now
    let input: PlanInput = normalizeLegacyInput({
      city: 'dc',
      situation:
        gift.occasion === 'anniversary' ? 'anniversary'
        : gift.occasion === 'first-date-help' ? 'first-date'
        : 'casual-hang',
      vibe: gift.vibe || 'romantic',
      activity: 'dinner',
      budget: gift.budget || '60-100',
      neighborhood: gift.neighborhood || undefined,
      freeText: gift.free_text || undefined,
    });

    // Parse free text if provided
    if (gift.free_text) {
      try {
        const parsed: any = await parseFreeText(gift.free_text);
        input = { ...input, ...parsed };
      } catch (e) {
        console.error('parseFreeText failed for wingman gift', e);
      }
    }

    const rawItinerary = buildItinerary(input, {}, []);
    const itinerary = validateVenues(rawItinerary);

    // Write choreography with full copilot (it's a paid gift, they get everything)
    let blurbs: string[] = [];
    let shareBlurb = itinerary.stops.map((s) => s.venue.name).join(' → ');
    let copilot: any = undefined;

    try {
      const r = await writeChoreography(itinerary, {
        includeeCopilot: true,
        dateHistory: [],
      });
      blurbs = r.blurbs;
      shareBlurb = r.shareBlurb;
      copilot = r.copilot;
    } catch (e) {
      console.error('writeChoreography failed for wingman', e);
    }

    itinerary.stops = itinerary.stops.map((s, i) => ({
      ...s,
      blurb: blurbs[i] || `${s.venue.hook}. ${s.venue.desc}`,
    }));

    if (copilot?.dressCode) {
      itinerary.dressCode = copilot.dressCode;
    }

    // Persist the plan
    const { data: plan, error: planErr } = await svc
      .from('plans')
      .insert({
        user_id: gift.sender_id,
        city: input.city,
        situation: input.occasion,
        vibe: input.vibe,
        activity: input.activity,
        budget: input.budget,
        natural_language: gift.free_text || null,
        itinerary,
        share_blurb: shareBlurb,
        is_public: true,
        wingman_gift_id: giftId,
      })
      .select('id, share_id')
      .single();

    if (planErr) {
      console.error('plan insert failed for wingman', planErr);
      throw new Error('Could not save plan');
    }

    // Update gift with plan reference
    await svc
      .from('wingman_gifts')
      .update({ status: 'delivered', plan_id: plan.id, share_id: plan.share_id })
      .eq('id', giftId);

    // Get sender info for the email
    const { data: sender } = await svc
      .from('profiles')
      .select('full_name')
      .eq('id', gift.sender_id)
      .single();

    const senderName = sender?.full_name || 'Someone special';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.datingdex.com';
    const planUrl = `${siteUrl}/plan/${plan.share_id}`;
    const stops = itinerary.stops.map((s: any) => s.venue?.name).filter(Boolean);
    const topLine = stops.join(' → ');

    // Send the delivery email
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const occasionLabel =
        gift.occasion === 'birthday' ? 'birthday' :
        gift.occasion === 'anniversary' ? 'anniversary' :
        gift.occasion === 'surprise' ? 'surprise' :
        'date night';

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'DatingDex <hello@datingdex.com>',
        to: gift.recipient_email,
        subject: `${senderName} planned a ${occasionLabel} for you ✨`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
            <div style="color:#FF5C3A;font-weight:800;letter-spacing:1px;font-size:14px;">DATINGDEX</div>
            <h1 style="font-size:28px;margin:16px 0 8px;line-height:1.2;">Someone planned a date night for you.</h1>
            <p style="color:#444;line-height:1.6;font-size:16px;">
              ${senderName} used DatingDex to build you a fully choreographed evening in DC —
              where to go, when to arrive, what to order, and more.
            </p>
            ${gift.personal_note ? `
            <div style="background:#f8f8f8;border-left:3px solid #FF5C3A;padding:16px 20px;margin:16px 0;border-radius:0 12px 12px 0;">
              <p style="margin:0;color:#444;font-style:italic;line-height:1.5;">"${gift.personal_note}"</p>
              <p style="margin:8px 0 0;color:#888;font-size:13px;">— ${senderName}</p>
            </div>` : ''}
            <div style="background:linear-gradient(135deg,#1a1a1a,#2d1b14);border-radius:16px;padding:24px;margin:24px 0;">
              <div style="color:#FF5C3A;font-size:13px;font-weight:700;letter-spacing:1px;">YOUR PLAN</div>
              <div style="color:#fff;font-size:22px;font-weight:700;margin-top:8px;line-height:1.3;">${topLine}</div>
              ${itinerary.dressCode ? `<div style="color:#999;font-size:14px;margin-top:8px;">👔 ${itinerary.dressCode}</div>` : ''}
            </div>
            <a href="${planUrl}" style="display:inline-block;background:#FF5C3A;color:#fff;padding:16px 32px;border-radius:999px;font-weight:700;text-decoration:none;font-size:16px;">See your full date plan →</a>
            <p style="color:#888;font-size:13px;margin-top:24px;line-height:1.5;">
              Your plan includes timing, booking links, and insider tips for each stop.
              Sign up free to save it, share it, and get recommendations that learn your taste.
            </p>
            <p style="margin-top:32px;color:#888;font-size:12px;">
              This plan was gifted to you via <a href="${siteUrl}" style="color:#FF5C3A;">DatingDex</a>.
              Questions? <a href="mailto:hello@datingdex.com" style="color:#888;">hello@datingdex.com</a>
            </p>
          </div>
        `,
      });
      console.log(`✓ Wingman plan delivered to ${gift.recipient_email}`);
    }

    return NextResponse.json({ ok: true, shareId: plan.share_id });
  } catch (err: any) {
    console.error('wingman fulfill error', err);
    await svc.from('wingman_gifts').update({ status: 'failed' }).eq('id', giftId);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
