import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

/** Source of truth for what plan a user actually has — driven by Stripe's
 * subscription object itself (via subscription.metadata.userId, set at
 * Checkout time and preserved across portal-initiated plan switches) rather
 * than the checkout.session.completed event, so plan upgrades/downgrades
 * done later through the Billing Portal stay in sync too. Uses the
 * service-role client since a webhook has no authenticated user session for
 * RLS to key off. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price?.id;
        const { data: plan } = await supabase.from('plans').select('id').eq('stripe_price_id', priceId).maybeSingle();
        if (!plan) {
          console.error(`[stripe webhook] no plan found for price ${priceId}`);
          break;
        }

        const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan_id: plan.id,
          status: sub.status,
          stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          stripe_subscription_id: sub.id,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const { data: freePlan } = await supabase.from('plans').select('id').eq('slug', 'free').maybeSingle();
        if (!freePlan) break;

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan_id: freePlan.id,
          status: 'canceled',
          stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          stripe_subscription_id: sub.id,
          current_period_end: null,
          updated_at: new Date().toISOString()
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[stripe webhook] handler failed', err);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
