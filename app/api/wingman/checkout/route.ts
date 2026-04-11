import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINGMAN_PRICE_CENTS = 799; // $7.99

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const supabase = createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ message: 'Sign in first.' }, { status: 401 });

  const {
    recipientName,
    recipientEmail,
    occasion,
    personalNote,
    neighborhood,
    vibe,
    budget,
    freeText,
    deliveryDate,
  } = body;

  if (!recipientName || !recipientEmail) {
    return NextResponse.json({ message: 'Recipient name and email are required.' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ message: 'Payments launching soon.' }, { status: 200 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
  const svc = createServiceClient();

  // Get or create Stripe customer
  const { data: profile } = await svc.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single();
  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const c = await stripe.customers.create({ email: user.email!, metadata: { user_id: user.id } });
    customerId = c.id;
    await svc.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  // Create the gift record (pending until payment completes)
  const { data: gift, error: giftErr } = await svc
    .from('wingman_gifts')
    .insert({
      sender_id: user.id,
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      occasion,
      personal_note: personalNote || null,
      neighborhood: neighborhood || null,
      vibe,
      budget,
      free_text: freeText || null,
      delivery_date: deliveryDate || null,
      status: 'pending_payment',
    })
    .select('id')
    .single();

  if (giftErr || !gift) {
    console.error('wingman gift insert failed', giftErr);
    return NextResponse.json({ message: 'Could not create gift.' }, { status: 500 });
  }

  // Create Stripe checkout for one-time $7.99 payment
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: WINGMAN_PRICE_CENTS,
          product_data: {
            name: `Wingman Date Plan for ${recipientName}`,
            description: `A surprise ${occasion} date night plan, delivered to ${recipientEmail}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wingman/sent?id=${gift.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wingman?cancelled=true`,
    metadata: {
      user_id: user.id,
      gift_id: gift.id,
      type: 'wingman',
    },
  });

  return NextResponse.json({ url: session.url });
}
