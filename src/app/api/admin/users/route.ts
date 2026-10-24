import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let users: User[];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw error;
    users = data.users;
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Could not list users — check SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
  }

  // The admin's own cookie-bound client already sees every user's rows here
  // (not just their own) via the is_admin() bypass baked into kv_channels'
  // RLS policies — no need for the service-role client for this query, only
  // for auth.admin.listUsers() above, which isn't a regular table at all.
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [{ data: channelRows }, { data: usageRows }, { data: subRows }] = await Promise.all([
    supabase.from('kv_channels').select('user_id, data') as unknown as Promise<{
      data: { user_id: string; data: { tracked?: boolean } }[] | null;
    }>,
    supabase.from('usage_events').select('user_id').gte('created_at', monthStart.toISOString()) as unknown as Promise<{
      data: { user_id: string }[] | null;
    }>,
    supabase.from('subscriptions').select('user_id, plans(name)') as unknown as Promise<{
      data: { user_id: string; plans: { name: string } | null }[] | null;
    }>
  ]);

  const counts = new Map<string, { channels: number; tracked: number }>();
  for (const row of channelRows ?? []) {
    const entry = counts.get(row.user_id) ?? { channels: 0, tracked: 0 };
    entry.channels += 1;
    if (row.data?.tracked) entry.tracked += 1;
    counts.set(row.user_id, entry);
  }

  const requestCounts = new Map<string, number>();
  for (const row of usageRows ?? []) {
    requestCounts.set(row.user_id, (requestCounts.get(row.user_id) ?? 0) + 1);
  }

  const planByUser = new Map<string, string>();
  for (const row of subRows ?? []) {
    if (row.plans?.name) planByUser.set(row.user_id, row.plans.name);
  }

  const result = users.map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at,
    channels: counts.get(u.id)?.channels ?? 0,
    tracked: counts.get(u.id)?.tracked ?? 0,
    requestsThisMonth: requestCounts.get(u.id) ?? 0,
    planName: planByUser.get(u.id) ?? '—',
    isSelf: u.id === user.id
  }));

  return NextResponse.json({ users: result });
}
