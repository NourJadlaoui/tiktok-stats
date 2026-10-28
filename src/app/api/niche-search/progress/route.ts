import { NextRequest, NextResponse } from 'next/server';
import { getProgress } from '@/lib/scrapeProgress';
import { nicheProgressKey } from '@/lib/dataProviders/tiktokSearch';
import { requireEffectiveUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get('q')?.trim();
  if (!term) {
    return NextResponse.json({ status: 'starting', fetched: 0, total: 0, updatedAt: Date.now() });
  }

  // Scoped to the caller's own effectiveUserId — see the equivalent
  // comment in /api/profile/[username]/progress/route.ts.
  let effectiveUserId: string;
  try {
    ({ effectiveUserId } = await requireEffectiveUser());
  } catch {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const progress = getProgress(effectiveUserId, nicheProgressKey(term));
  return NextResponse.json(progress || { status: 'starting', fetched: 0, total: 0, updatedAt: Date.now() });
}
