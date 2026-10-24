import Stripe from 'stripe';

let cached: Stripe | null = null;

/** Server-only Stripe client. Throws (not silently returns null) if
 * STRIPE_SECRET_KEY isn't set — callers only reach this once the
 * `payments_enabled` app_config toggle is already confirmed on, so a
 * missing key at that point is a real misconfiguration worth surfacing. */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.');
  cached = new Stripe(key);
  return cached;
}
