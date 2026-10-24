import { NextRequest, NextResponse } from 'next/server';
import { loadChannelData } from '@/lib/channel';
import { ChannelNotFoundError, ScrapeBlockedError } from '@/lib/dataProviders';
import { PlanLimitError } from '@/lib/plans';

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1';
  try {
    const data = await loadChannelData(username, forceRefresh);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json({ error: err.message, limitType: err.limitType }, { status: 402 });
    }
    if (err instanceof ChannelNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ScrapeBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch TikTok data.' }, { status: 500 });
  }
}
