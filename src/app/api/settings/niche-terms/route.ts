import { NextRequest, NextResponse } from 'next/server';
import { getNicheTerms, addNicheTerm, editNicheTerm, deleteNicheTerm } from '@/lib/settings';

export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get('language');
  if (!language) return NextResponse.json({ error: 'Missing language.' }, { status: 400 });
  return NextResponse.json({ language, terms: await getNicheTerms(language) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { language, term } = body;
  if (!language || typeof term !== 'string') {
    return NextResponse.json({ error: 'Missing language or term.' }, { status: 400 });
  }
  try {
    const terms = await addNicheTerm(language, term);
    return NextResponse.json({ language, terms });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not add term.' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { language, oldTerm, newTerm } = body;
  if (!language || typeof oldTerm !== 'string' || typeof newTerm !== 'string') {
    return NextResponse.json({ error: 'Missing language, oldTerm, or newTerm.' }, { status: 400 });
  }
  try {
    const terms = await editNicheTerm(language, oldTerm, newTerm);
    return NextResponse.json({ language, terms });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not edit term.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const language = req.nextUrl.searchParams.get('language');
  const term = req.nextUrl.searchParams.get('term');
  if (!language || !term) return NextResponse.json({ error: 'Missing language or term.' }, { status: 400 });
  const terms = await deleteNicheTerm(language, term);
  return NextResponse.json({ language, terms });
}
