import { NextRequest, NextResponse } from 'next/server';
import { getNicheFinderRun } from '@/lib/nicheFinderStore';

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get('runId');
  if (!runId) {
    return NextResponse.json({ error: 'Missing runId.' }, { status: 400 });
  }
  const run = await getNicheFinderRun(runId);
  if (!run) {
    return NextResponse.json({ error: 'Run not found.' }, { status: 404 });
  }
  return NextResponse.json(run);
}
