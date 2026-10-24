import { NextRequest, NextResponse } from 'next/server';
import { getSyncIntervalHours, setSyncIntervalHours, SYNC_INTERVAL_OPTIONS } from '@/lib/settings';

export async function GET() {
  return NextResponse.json({ syncIntervalHours: await getSyncIntervalHours(), options: SYNC_INTERVAL_OPTIONS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const syncIntervalHours = await setSyncIntervalHours(Number(body.syncIntervalHours));
    return NextResponse.json({ syncIntervalHours });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save.' }, { status: 400 });
  }
}
