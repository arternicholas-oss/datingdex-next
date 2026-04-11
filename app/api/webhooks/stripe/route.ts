import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Map Stripe price IDs to profile tiers
function priceToTier(priceId: string): 'premium' | 'annual' | 'featured' | 'restaurant_premium' | null {
  const map: Record<string, 'premium' | 'annual' | 'featured' | 'restaurant_premium'> = {
    [process.env.STRIPE_PRICE_PREMIUM_MONTHLY!]: 'premium',
    [process.env.STRIPE_PRICE_PREMIUM_ANNUAL!]: 'annual',
    [process.env.STRIPE_PRICE_RESTAURANT_FEATURED!]: 'featured',
    [process.env.STRIPE_PRICE_RESTAURANT_PREMIUM!]: 'restaurant_premium',
  };
  return map[priceId] || null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const svc = createServiceClient();

  try {
    switch (event.type) {
      // Checkout completed — activate subscription OR fulfill wingman gift
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;

        // --- Wingman Mode (one-time payment) ---
        if (session.metadata?.type === 'wingman' && session.mode === 'payment') {
          const giftId = session.metadata?.gift_id;
          if (giftId) {
            // Mark gift as paid and trigger plan generation
            await svc
              .from('wingman_gifts')
              .update({ status: 'paid', stripe_session_id: session.id })
              .eq('id', giftId);
            console.log(`✓ Wingman gift ${giftId} paid — will generate plan`);

            // Trigger async plan generation + delivery
            // The /api/wingman/fulfill endpoint handles this
            const fulfillUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/wingman/fulfill`;
            fetch(fulfillUrl, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${process.env.CRON_SECRET}`,
              },
              body: JSON.stringify({ giftId }),
            }).catch((e) => console.error('fulfill trigger failed', e));
          }
          break;
        }

        // --- Subscription checkout ---
        if (session.mode !== 'subscription') break;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error('checkout.session.completed: no user_id in metadata');
          break;
        }

        // Fetch the subscription to get the price ID
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = priceId ? priceToTier(priceId) : 'premium';

        await svc
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            tier: tier || 'premium',
          })
          .eq('id', userId);

        console.log(`✓ User ${userId} activated: tier=${tier}`);
        break;
      }

      // Subscription updated (upgrade, downgrade, renewal)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = priceId ? priceToTier(priceId) : null;

        // Only update if subscription is active
        if (subscription.status === 'active' && tier) {
          await svc
            .from('profiles')
            .update({ tier, stripe_subscription_id: subscription.id })
            .eq('stripe_customer_id', customerId);

          console.log(`✓ Subscription updated for customer ${customerId}: tier=${tier}`);
        }

        // Handle past_due or unpaid — downgrade
        if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          console.log(`⚠ Subscription ${subscription.id} is ${subscription.status}`);
          // Don't immediately downgrade — give payment retry window
        }
        break;
      }

      // Subscription cancelled or expired
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await svc
          .from('profiles')
          .update({ tier: 'free', stripe_subscription_id: null })
          .eq('stripe_customer_id', customerId);

        console.log(`✓ Subscription cancelled for customer ${customerId} → free tier`);
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // After final retry failure, Stripe will fire subscription.deleted
        // Log it for monitoring
        console.warn(`⚠ Payment failed for customer ${customerId}, invoice ${invoice.id}`);
        break;
      }

      default:
        // Unhandled event type — that's fine
        break;
    }
  } catch (err: any) {
    console.error(`Webhook handler error for ${event.type}:`, err.message);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
