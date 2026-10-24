import { NextRequest, NextResponse } from 'next/server';
import { getNicheSearchResult } from '@/lib/nicheSearch';
import { getConfig } from '@/lib/config';
import { ScrapeBlockedError } from '@/lib/dataProviders';
import { PlanLimitError } from '@/lib/plans';

const HARD_MAX_VIDEOS = 1000;

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get('q')?.trim();
  if (!term) {
    return NextResponse.json({ error: 'Missing search term (?q=...).' }, { status: 400 });
  }

  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1';
  const { nicheMaxVideos } = getConfig();
  const maxParam = Number(req.nextUrl.searchParams.get('max'));
  const max = Number.isFinite(maxParam) && maxParam > 0 ? Math.min(maxParam, HARD_MAX_VIDEOS) : nicheMaxVideos;

  try {
    const result = await getNicheSearchResult(term, max, forceRefresh);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json({ error: err.message, limitType: err.limitType }, { status: 402 });
    }
    if (err instanceof ScrapeBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to search TikTok.' }, { status: 500 });
  }
}
