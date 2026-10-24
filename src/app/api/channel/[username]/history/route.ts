import { NextResponse } from 'next/server';
import { getProfileHistory } from '@/lib/history';

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  const history = await getProfileHistory(clean);
  return NextResponse.json(history);
}
