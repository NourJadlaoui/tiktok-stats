import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const {
    data: { users }
  } = await admin.auth.admin.listUsers({ perPage: 200 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = users.filter((u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo).length;

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  // Unfiltered — the admin's own session sees every user's rows here via the
  // RLS admin bypass, which is exactly what a platform-wide aggregate needs.
  const supabase = await createClient();
  const [{ count: scansThisMonth }, { count: totalProfilesScanned }, { data: subs }] = await Promise.all([
    supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString()),
    supabase.from('kv_channels').select('user_id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('status, plans(price_cents, is_free_trial)')
  ]);

  let payingSubscribers = 0;
  let mrrCents = 0;
  for (const row of (subs ?? []) as unknown as { status: string; plans: { price_cents: number; is_free_trial: boolean } | null }[]) {
    if (!row.plans || row.plans.is_free_trial || row.plans.price_cents <= 0) continue;
    if (row.status !== 'active' && row.status !== 'trialing') continue;
    payingSubscribers += 1;
    mrrCents += row.plans.price_cents;
  }

  return NextResponse.json({
    totalUsers: users.length,
    activeUsers30d: activeUsers,
    scansThisMonth: scansThisMonth ?? 0,
    totalProfilesScanned: totalProfilesScanned ?? 0,
    payingSubscribers,
    mrrCents
  });
}
