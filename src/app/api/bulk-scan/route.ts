import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startBulkScan } from '@/lib/bulkScan';
import { PlanLimitError } from '@/lib/plans';

export async function POST(request: Request) {
  const { usernames } = await request.json().catch(() => ({}));
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return NextResponse.json({ error: 'Provide a non-empty list of usernames.' }, { status: 400 });
  }
  if (usernames.length > 200) {
    return NextResponse.json({ error: 'Max 200 usernames per batch.' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  try {
    const id = await startBulkScan(usernames, session.access_token);
    return NextResponse.json({ id });
  } catch (err: any) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json({ error: err.message, limitType: err.limitType }, { status: 402 });
    }
    return NextResponse.json({ error: err.message ?? 'Could not start scan.' }, { status: 500 });
  }
}
