import { NextResponse } from 'next/server';
import { getProgress } from '@/lib/scrapeProgress';
import { requireEffectiveUser } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const clean = username.trim().toLowerCase().replace(/^@/, '');

  // Scoped to the caller's own effectiveUserId — progress is stored keyed
  // by (ownerId, username), so this can only ever read back a scan this
  // same account started, never another account's in-flight scan of the
  // same username. See scrapeProgress.ts.
  let effectiveUserId: string;
  try {
    ({ effectiveUserId } = await requireEffectiveUser());
  } catch {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const progress = getProgress(effectiveUserId, clean);
  return NextResponse.json(progress || { status: 'starting', fetched: 0, total: 0, updatedAt: Date.now() });
}
