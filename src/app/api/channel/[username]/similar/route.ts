import { NextRequest, NextResponse } from 'next/server';
import { loadChannelData } from '@/lib/channel';
import { getNicheSearchResult } from '@/lib/nicheSearch';
import { getTopHashtagsByUsage } from '@/lib/seo';
import { ChannelNotFoundError, ScrapeBlockedError } from '@/lib/dataProviders';
import { getConfig } from '@/lib/config';

const DEFAULT_MAX_VIDEOS = 80;
const RESULT_LIMIT = 8;

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const clean = username.trim().toLowerCase().replace(/^@/, '');

  try {
    const data = await loadChannelData(clean);

    const topHashtag = getTopHashtagsByUsage(data.videos, 1)[0]?.hashtag;
    const term = topHashtag || data.settings.niche;

    const { nicheMaxVideos } = getConfig();
    const maxParam = Number(req.nextUrl.searchParams.get('max'));
    const max = Number.isFinite(maxParam) && maxParam > 0 ? Math.min(maxParam, nicheMaxVideos) : DEFAULT_MAX_VIDEOS;

    const result = await getNicheSearchResult(term, max);

    const similar = result.profiles
      .filter((p) => p.username !== clean)
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, RESULT_LIMIT);

    return NextResponse.json({ term, profiles: similar });
  } catch (err) {
    if (err instanceof ChannelNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ScrapeBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to find similar creators.' }, { status: 500 });
  }
}
