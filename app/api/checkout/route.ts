import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { plan, role } = await req.json().catch(() => ({} as any));
  const supabase = createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ message: 'Sign in first.' }, { status: 401 });

  const priceId =
    plan === 'annual'
      ? process.env.STRIPE_PRICE_PREMIUM_ANNUAL
      : plan === 'restaurant_featured'
      ? process.env.STRIPE_PRICE_RESTAURANT_FEATURED
      : plan === 'restaurant_premium'
      ? process.env.STRIPE_PRICE_RESTAURANT_PREMIUM
      : process.env.STRIPE_PRICE_PREMIUM_MONTHLY;

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return NextResponse.json(
      { message: 'Payments are launching soon — your spot is held. We\'ll email you the moment it\'s live.' },
      { status: 200 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any });
  const svc = createServiceClient();
  const { data: profile } = await svc.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const c = await stripe.customers.create({ email: user.email!, metadata: { user_id: user.id } });
    customerId = c.id;
    await svc.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/premium?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/premium?status=cancelled`,
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
