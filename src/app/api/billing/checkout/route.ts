import { NextRequest, NextResponse } from 'next/server';
import { requireEffectiveUser } from '@/lib/auth';
import { getPlanById, getPaymentsEnabled, getSubscriptionForUser } from '@/lib/plans';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const paymentsEnabled = await getPaymentsEnabled();
  if (!paymentsEnabled) {
    return NextResponse.json({ error: 'Payments are currently disabled.' }, { status: 403 });
  }

  const { effectiveUserId, effectiveEmail } = await requireEffectiveUser();
  const { planId } = await req.json().catch(() => ({}));
  if (!planId || typeof planId !== 'string') {
    return NextResponse.json({ error: 'Missing planId.' }, { status: 400 });
  }

  const plan = await getPlanById(planId);
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: 'Unknown plan.' }, { status: 404 });
  }
  if (!plan.stripePriceId) {
    return NextResponse.json({ error: `${plan.name} has no Stripe price configured yet.` }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = req.nextUrl.origin;
  const existing = await getSubscriptionForUser(effectiveUserId);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    client_reference_id: effectiveUserId,
    ...(existing?.stripeCustomerId ? { customer: existing.stripeCustomerId } : { customer_email: effectiveEmail }),
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    metadata: { userId: effectiveUserId, planId: plan.id },
    subscription_data: { metadata: { userId: effectiveUserId, planId: plan.id } }
  });

  return NextResponse.json({ url: session.url });
}
