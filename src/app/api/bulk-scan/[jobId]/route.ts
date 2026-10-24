import { NextResponse } from 'next/server';
import { getBulkScanJob } from '@/lib/bulkScan';

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await getBulkScanJob(jobId);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json(job);
}
