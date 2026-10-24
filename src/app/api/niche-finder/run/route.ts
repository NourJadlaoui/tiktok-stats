import { NextRequest, NextResponse } from 'next/server';
import { startNicheFinderRun } from '@/lib/nicheFinder';
import { CoverageLevel } from '@/lib/nicheFinderTerms';
import { getConfig } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';

const VALID_COVERAGE: CoverageLevel[] = ['quick', 'standard', 'full'];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const languages: string[] = Array.isArray(body.languages) ? body.languages.filter((l: unknown) => typeof l === 'string') : [];

  if (languages.length === 0) {
    return NextResponse.json({ error: 'Select at least one language.' }, { status: 400 });
  }
  if (languages.length > 3) {
    return NextResponse.json({ error: 'Select at most 3 languages at once.' }, { status: 400 });
  }

  const coverage: CoverageLevel = VALID_COVERAGE.includes(body.coverage) ? body.coverage : 'standard';
  const { nicheMaxVideos } = getConfig();
  const maxVideosPerNiche = Number.isFinite(Number(body.maxVideosPerNiche))
    ? Math.min(Math.max(Number(body.maxVideosPerNiche), 20), nicheMaxVideos)
    : 60;

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const runId = await startNicheFinderRun(languages, maxVideosPerNiche, coverage, session.access_token);
  return NextResponse.json({ runId });
}
