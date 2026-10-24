import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateChannelSettings } from '@/lib/channel';

const bodySchema = z.object({
  niche: z.string().min(1).max(40).optional(),
  language: z.string().min(1).max(40).optional(),
  rpm: z.number().min(0).max(100).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  try {
    const settings = await updateChannelSettings(username.toLowerCase(), parsed.data);
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: 'Channel not found — load its dashboard at least once first.' }, { status: 404 });
  }
}
