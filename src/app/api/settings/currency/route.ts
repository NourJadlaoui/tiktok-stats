import { NextRequest, NextResponse } from 'next/server';
import { getUsdToEurRate, setUsdToEurRate } from '@/lib/settings';

export async function GET() {
  return NextResponse.json({ usdToEurRate: await getUsdToEurRate() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const usdToEurRate = await setUsdToEurRate(Number(body.usdToEurRate));
    return NextResponse.json({ usdToEurRate });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save.' }, { status: 400 });
  }
}
