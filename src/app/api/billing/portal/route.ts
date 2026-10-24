import { NextRequest, NextResponse } from 'next/server';
import { requireEffectiveUser } from '@/lib/auth';
import { getSubscriptionForUser } from '@/lib/plans';
import { getStripe } from '@/lib/stripe';

/** Opens Stripe's hosted Billing Portal so a subscriber can update their
 * card, switch plans, or cancel — without us building any of that UI
 * ourselves. Requires the user to already have a Stripe customer (i.e.
 * they've been through Checkout at least once). */
export async function POST(req: NextRequest) {
  const { effectiveUserId } = await requireEffectiveUser();
  const sub = await getSubscriptionForUser(effectiveUserId);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account yet — subscribe to a paid plan first.' }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = req.nextUrl.origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/billing`
  });

  return NextResponse.json({ url: session.url });
}
