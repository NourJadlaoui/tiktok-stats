import { NextResponse } from 'next/server';
import { listNicheSearchHistory } from '@/lib/nicheSearch';

export async function GET() {
  return NextResponse.json(await listNicheSearchHistory());
}
