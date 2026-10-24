import { NextResponse } from 'next/server';
import { getBulkScanJob } from '@/lib/bulkScan';
import { listTrackedAccounts } from '@/lib/channel';
import { buildGalleryRows } from '@/lib/galleryRows';
import { requireUser } from '@/lib/auth';

/** Gallery rows for just the usernames a bulk-scan job successfully
 * scanned — lets the Bulk Search page show the same card gallery inline
 * once a batch finishes, instead of only linking through to Accounts. */
export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await getBulkScanJob(jobId);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  const user = await requireUser();
  const doneUsernames = new Set(job.results.filter((r) => r.status === 'done').map((r) => r.username));

  const allAccounts = await listTrackedAccounts();
  const scannedAccounts = allAccounts.filter((a) => doneUsernames.has(a.username));
  const rows = await buildGalleryRows(scannedAccounts, user.id);

  return NextResponse.json({ rows });
}
