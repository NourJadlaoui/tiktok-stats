import { NextRequest, NextResponse } from 'next/server';
import { getProgress } from '@/lib/scrapeProgress';
import { nicheProgressKey } from '@/lib/dataProviders/tiktokSearch';

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get('q')?.trim();
  if (!term) {
    return NextResponse.json({ status: 'starting', fetched: 0, total: 0, updatedAt: Date.now() });
  }
  const progress = getProgress(nicheProgressKey(term));
  return NextResponse.json(progress || { status: 'starting', fetched: 0, total: 0, updatedAt: Date.now() });
}
