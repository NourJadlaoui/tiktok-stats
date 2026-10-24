import { NextResponse } from 'next/server';
import { listTrackedAccounts } from '@/lib/channel';

export async function GET() {
  return NextResponse.json(await listTrackedAccounts());
}
