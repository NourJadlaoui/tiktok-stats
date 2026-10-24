import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updatePlan } from '@/lib/plans';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  for (const key of [
    'slug',
    'name',
    'priceCents',
    'billingInterval',
    'monthlyRequestLimit',
    'maxTrackedProfiles',
    'maxVideosPerProfile',
    'bulkScanMaxUsernames',
    'isFreeTrial',
    'isActive',
    'sortOrder',
    'features',
    'stripePriceId'
  ]) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const plan = await updatePlan(id, updates as any);
    return NextResponse.json({ plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Could not update plan.' }, { status: 500 });
  }
}
