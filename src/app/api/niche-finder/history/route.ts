import { NextResponse } from 'next/server';
import { listNicheFinderRuns } from '@/lib/nicheFinderStore';

export async function GET() {
  const runs = await listNicheFinderRuns();
  // Trim per-niche detail for the history list — the status endpoint has the full run.
  return NextResponse.json(
    runs.map((r) => ({
      id: r.id,
      languages: r.languages,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      termsTotal: r.termsTotal,
      termsCompleted: r.termsCompleted,
      topResult: r.results[0] ?? null
    }))
  );
}
