import { NextResponse } from 'next/server';
import { listActivePlans } from '@/lib/plans';

/** Public — powers the landing page pricing table and every "you hit your
 * plan's limit, upgrade" popup across the app. No auth required, RLS's
 * "anyone can read active plans" policy already allows an anonymous read. */
export async function GET() {
  const plans = await listActivePlans();
  return NextResponse.json({ plans });
}
