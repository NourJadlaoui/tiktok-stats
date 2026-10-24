import { createClient } from './supabase/server';
import { requireEffectiveUser, getEffectiveUser } from './auth';
import { getUsageCountThisMonth, getUsageCountLifetime, UsageEventType } from './usage';

/** True when this request is the admin using their OWN account directly
 * (not "Acting as" someone else) — the platform operator shouldn't be
 * capped by their own default plan. While Acting As a user, limits still
 * apply normally so the admin sees exactly what that user experiences. */
async function isPlatformAdminOnOwnAccount(): Promise<boolean> {
  const effective = await getEffectiveUser();
  return Boolean(effective?.realUser.isAdmin && !effective.isActingAs);
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  billingInterval: 'month' | 'year' | 'one_time';
  /** For the free-trial plan, this is a LIFETIME cap (total scans ever);
   * for every other plan it's a per-calendar-month cap. null = unlimited. */
  monthlyRequestLimit: number | null;
  /** Cap on distinct TikTok usernames this account can ever have on file
   * (kv_channels row count) — unrelated to the "Track this creator"
   * toggle feature elsewhere in the app, which is just a bookmark flag on
   * a profile that's already within this cap. null = unlimited. */
  maxTrackedProfiles: number | null;
  /** Caps how many videos get fetched per profile scan, regardless of the
   * server's own maxVideosToFetch config. null = use server config as-is. */
  maxVideosPerProfile: number | null;
  bulkScanMaxUsernames: number;
  isFreeTrial: boolean;
  isActive: boolean;
  sortOrder: number;
  features: string[];
  stripePriceId: string | null;
}

function mapPlan(row: any): Plan {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    priceCents: row.price_cents,
    currency: row.currency,
    billingInterval: row.billing_interval,
    monthlyRequestLimit: row.monthly_request_limit,
    maxTrackedProfiles: row.max_tracked_profiles,
    maxVideosPerProfile: row.max_videos_per_profile,
    bulkScanMaxUsernames: row.bulk_scan_max_usernames,
    isFreeTrial: row.is_free_trial,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    features: row.features ?? [],
    stripePriceId: row.stripe_price_id
  };
}

/** Public — the landing page's pricing table and the free-trial signup
 * flow both need this without requiring auth. */
export async function listActivePlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order');
  if (error) throw error;
  return (data ?? []).map(mapPlan);
}

export async function listAllPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('plans').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map(mapPlan);
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('plans').select('*').eq('id', id).maybeSingle();
  return data ? mapPlan(data) : null;
}

async function requireAdmin() {
  const { realUser } = await requireEffectiveUser();
  if (!realUser.isAdmin) throw new Error('Admin access required.');
}

export interface PlanInput {
  slug: string;
  name: string;
  priceCents: number;
  billingInterval: 'month' | 'year' | 'one_time';
  monthlyRequestLimit: number | null;
  maxTrackedProfiles: number | null;
  maxVideosPerProfile: number | null;
  bulkScanMaxUsernames: number;
  isFreeTrial: boolean;
  isActive: boolean;
  sortOrder: number;
  features: string[];
  stripePriceId: string | null;
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plans')
    .insert({
      slug: input.slug,
      name: input.name,
      price_cents: input.priceCents,
      billing_interval: input.billingInterval,
      monthly_request_limit: input.monthlyRequestLimit,
      max_tracked_profiles: input.maxTrackedProfiles,
      max_videos_per_profile: input.maxVideosPerProfile,
      bulk_scan_max_usernames: input.bulkScanMaxUsernames,
      is_free_trial: input.isFreeTrial,
      is_active: input.isActive,
      sort_order: input.sortOrder,
      features: input.features,
      stripe_price_id: input.stripePriceId
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapPlan(data);
}

export async function updatePlan(id: string, updates: Partial<PlanInput>): Promise<Plan> {
  await requireAdmin();
  const supabase = await createClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.slug !== undefined) patch.slug = updates.slug;
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.priceCents !== undefined) patch.price_cents = updates.priceCents;
  if (updates.billingInterval !== undefined) patch.billing_interval = updates.billingInterval;
  if (updates.monthlyRequestLimit !== undefined) patch.monthly_request_limit = updates.monthlyRequestLimit;
  if (updates.maxTrackedProfiles !== undefined) patch.max_tracked_profiles = updates.maxTrackedProfiles;
  if (updates.maxVideosPerProfile !== undefined) patch.max_videos_per_profile = updates.maxVideosPerProfile;
  if (updates.bulkScanMaxUsernames !== undefined) patch.bulk_scan_max_usernames = updates.bulkScanMaxUsernames;
  if (updates.isFreeTrial !== undefined) patch.is_free_trial = updates.isFreeTrial;
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;
  if (updates.sortOrder !== undefined) patch.sort_order = updates.sortOrder;
  if (updates.features !== undefined) patch.features = updates.features;
  if (updates.stripePriceId !== undefined) patch.stripe_price_id = updates.stripePriceId;

  const { data, error } = await supabase.from('plans').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return mapPlan(data);
}

/** Deactivating (not deleting) is the normal way to retire a plan —
 * existing subscribers keep their row (plans.id is FK'd from
 * subscriptions), it just stops showing up for new signups/upgrades. */
export async function setPlanActive(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('plans').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export interface UserSubscription {
  planId: string;
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

async function mapSubscriptionRow(row: any): Promise<UserSubscription | null> {
  if (!row) return null;
  const plan = row.plans ? mapPlan(row.plans) : await getPlanById(row.plan_id);
  if (!plan) return null;
  return {
    planId: row.plan_id,
    plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id
  };
}

/** The signed-in (or, while an admin is "Acting as" someone, the
 * impersonated) user's own subscription + plan. */
export async function getMySubscription(): Promise<UserSubscription | null> {
  const { effectiveUserId } = await requireEffectiveUser();
  return getSubscriptionForUser(effectiveUserId);
}

/** Admin-only in practice (RLS only lets a caller read their own row
 * unless they're an admin) — used by the Admin dashboard's per-user table. */
export async function getSubscriptionForUser(userId: string): Promise<UserSubscription | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('subscriptions').select('*, plans(*)').eq('user_id', userId).maybeSingle();
  return mapSubscriptionRow(data);
}

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public limitType: 'requests' | 'profiles' | 'bulk_scan'
  ) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

/** Call before doing a REAL scan (a fresh fetch that actually costs a
 * RapidAPI request or a real TikTok page load) — throws PlanLimitError if
 * the user's plan request allowance is used up. Never called for cache
 * hits, which don't cost anything and shouldn't count against a limit. */
export async function enforceRequestLimit(userId: string, eventTypes: UsageEventType[]): Promise<void> {
  if (await isPlatformAdminOnOwnAccount()) return;
  const sub = await getSubscriptionForUser(userId);
  const plan = sub?.plan;
  if (!plan || plan.monthlyRequestLimit === null) return;

  const used = plan.isFreeTrial
    ? await getUsageCountLifetime(userId, eventTypes)
    : await getUsageCountThisMonth(userId, eventTypes);

  if (used >= plan.monthlyRequestLimit) {
    throw new PlanLimitError(
      plan.isFreeTrial
        ? `You've used all ${plan.monthlyRequestLimit} free scans on your trial. Upgrade to keep scanning.`
        : `You've reached your ${plan.name} plan's limit of ${plan.monthlyRequestLimit} scans this month. Upgrade for more, or wait for next month's reset.`,
      'requests'
    );
  }
}

/** Call before scanning a genuinely NEW username (one not already in
 * kv_channels) — re-scanning an already-known profile is always allowed
 * regardless of this cap. */
export async function enforceDistinctProfilesLimit(userId: string, currentDistinctCount: number): Promise<void> {
  if (await isPlatformAdminOnOwnAccount()) return;
  const sub = await getSubscriptionForUser(userId);
  const plan = sub?.plan;
  if (!plan || plan.maxTrackedProfiles === null) return;
  if (currentDistinctCount >= plan.maxTrackedProfiles) {
    throw new PlanLimitError(
      `Your ${plan.name} plan can have up to ${plan.maxTrackedProfiles} profiles on file. Remove one, or upgrade for more.`,
      'profiles'
    );
  }
}

export async function enforceBulkScanLimit(userId: string, requestedCount: number): Promise<void> {
  if (await isPlatformAdminOnOwnAccount()) return;
  const sub = await getSubscriptionForUser(userId);
  const plan = sub?.plan;
  const max = plan?.bulkScanMaxUsernames ?? 10;
  if (requestedCount > max) {
    throw new PlanLimitError(`Your ${plan?.name ?? 'current'} plan allows up to ${max} usernames per Bulk Search batch.`, 'bulk_scan');
  }
}

export async function getPaymentsEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from('app_config').select('value').eq('key', 'payments_enabled').maybeSingle();
  return data?.value === true;
}

export async function setPaymentsEnabled(enabled: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('app_config').update({ value: enabled }).eq('key', 'payments_enabled');
  if (error) throw error;
}
