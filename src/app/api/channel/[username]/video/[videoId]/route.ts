import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setVideoRpmOverride } from '@/lib/channel';

const bodySchema = z.object({
  rpm: z.number().min(0).max(100).nullable()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; videoId: string }> }
) {
  const { username, videoId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  await setVideoRpmOverride(username.toLowerCase(), videoId, parsed.data.rpm);
  return NextResponse.json({ ok: true });
}
