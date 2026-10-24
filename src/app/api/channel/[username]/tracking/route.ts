import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getChannelTracking, updateChannelTracking } from '@/lib/channel';
import { ChannelNotFoundError } from '@/lib/dataProviders';

const bodySchema = z.object({
  categories: z.array(z.string()).optional(),
  myScore: z.number().min(0).max(10).nullable().optional(),
  notes: z.string().max(4000).optional(),
  tracked: z.boolean().optional()
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const tracking = await getChannelTracking(username.toLowerCase());
    return NextResponse.json(tracking);
  } catch (err) {
    if (err instanceof ChannelNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to load tracking data.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  try {
    const tracking = await updateChannelTracking(username.toLowerCase(), parsed.data);
    return NextResponse.json(tracking);
  } catch (err) {
    if (err instanceof ChannelNotFoundError) {
      return NextResponse.json({ error: 'Channel not found — load its dashboard at least once first.' }, { status: 404 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save.' }, { status: 400 });
  }
}
