import { NextResponse } from 'next/server';
import { getProgress } from '@/lib/scrapeProgress';

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  const progress = getProgress(clean);
  return NextResponse.json(progress || { status: 'starting', fetched: 0, total: 0, updatedAt: Date.now() });
}
