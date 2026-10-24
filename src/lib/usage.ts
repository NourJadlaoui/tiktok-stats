import { createClient } from './supabase/server';

export type UsageEventType = 'profile_scan' | 'niche_search' | 'bulk_scan_item' | 'niche_finder_term';

/** Logs one billable action against a specific user (always the effective
 * user — see auth.ts — so usage logged while an admin is "Acting as"
 * someone counts against THAT user's plan, not the admin's own). Only
 * called for real scans (a fresh fetch that actually hit TikTok/RapidAPI),
 * never for cache hits — serving already-cached data doesn't cost
 * anything and shouldn't count against a plan's request limit. */
export async function logUsageEvent(userId: string, eventType: UsageEventType, subject: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('usage_events').insert({ user_id: userId, event_type: eventType, subject });
}

/** How many usage events of the given type(s) this user has logged since
 * the start of the current calendar month — what plan limits are checked
 * against. */
export async function getUsageCountThisMonth(userId: string, eventTypes: UsageEventType[]): Promise<number> {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('event_type', eventTypes)
    .gte('created_at', monthStart.toISOString());
  if (error) throw error;
  return count ?? 0;
}

/** Lifetime count (used for the free-trial plan, which limits total scans
 * ever rather than a monthly allowance). */
export async function getUsageCountLifetime(userId: string, eventTypes: UsageEventType[]): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('event_type', eventTypes);
  if (error) throw error;
  return count ?? 0;
}
