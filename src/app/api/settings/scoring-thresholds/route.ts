import { NextRequest, NextResponse } from 'next/server';
import { getScoringThresholds, setScoringThresholds } from '@/lib/settings';

export async function GET() {
  return NextResponse.json(await getScoringThresholds());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const updates: Record<string, number> = {};
  for (const key of ['monthlyRevenueGoal', 'lifetimeRevenueGoal', 'activeWindowDays']) {
    if (body[key] !== undefined) updates[key] = Number(body[key]);
  }
  try {
    const thresholds = await setScoringThresholds(updates);
    return NextResponse.json(thresholds);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save.' }, { status: 400 });
  }
}
