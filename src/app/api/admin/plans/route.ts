import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listAllPlans, createPlan, getPaymentsEnabled } from '@/lib/plans';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [plans, paymentsEnabled] = await Promise.all([listAllPlans(), getPaymentsEnabled()]);
  return NextResponse.json({ plans, paymentsEnabled });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.name) {
    return NextResponse.json({ error: 'slug and name are required.' }, { status: 400 });
  }
  try {
    const plan = await createPlan({
      slug: body.slug,
      name: body.name,
      priceCents: Number(body.priceCents) || 0,
      billingInterval: body.billingInterval ?? 'month',
      monthlyRequestLimit: body.monthlyRequestLimit === null ? null : Number(body.monthlyRequestLimit),
      maxTrackedProfiles: body.maxTrackedProfiles === null ? null : Number(body.maxTrackedProfiles),
      maxVideosPerProfile: body.maxVideosPerProfile === null ? null : Number(body.maxVideosPerProfile),
      bulkScanMaxUsernames: Number(body.bulkScanMaxUsernames) || 10,
      isFreeTrial: Boolean(body.isFreeTrial),
      isActive: body.isActive ?? true,
      sortOrder: Number(body.sortOrder) || 0,
      features: Array.isArray(body.features) ? body.features : [],
      stripePriceId: body.stripePriceId || null
    });
    return NextResponse.json({ plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Could not create plan.' }, { status: 500 });
  }
}
