import { NextRequest, NextResponse } from 'next/server';
import { getRpmByNiche, setRpmByNiche, deleteRpmByNiche } from '@/lib/settings';

export async function GET() {
  return NextResponse.json(await getRpmByNiche());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const niche = typeof body.niche === 'string' ? body.niche : '';
  const rpm = Number(body.rpm);

  try {
    const updated = await setRpmByNiche(niche, rpm);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const niche = req.nextUrl.searchParams.get('niche') || '';
  try {
    const updated = await deleteRpmByNiche(niche);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not delete.' }, { status: 400 });
  }
}
