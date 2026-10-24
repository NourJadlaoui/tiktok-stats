import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { setPaymentsEnabled } from '@/lib/plans';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { paymentsEnabled } = await req.json().catch(() => ({}));
  if (typeof paymentsEnabled !== 'boolean') {
    return NextResponse.json({ error: 'paymentsEnabled must be a boolean.' }, { status: 400 });
  }
  await setPaymentsEnabled(paymentsEnabled);
  return NextResponse.json({ ok: true });
}
