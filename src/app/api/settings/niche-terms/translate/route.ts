import { NextRequest, NextResponse } from 'next/server';
import { translateTerms, setNicheTerms, getNicheTerms, TranslationError } from '@/lib/settings';

/** Translates the English niche-term list into another language via a
 * configurable LibreTranslate-compatible API, and saves the result as that
 * language's editable term list (so it immediately shows up ready to
 * add/edit/delete further, same as any other language). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const targetLanguage = typeof body.targetLanguage === 'string' ? body.targetLanguage : '';
  if (!targetLanguage) return NextResponse.json({ error: 'Missing targetLanguage.' }, { status: 400 });
  if (targetLanguage === 'English') {
    return NextResponse.json({ error: 'English is already the source language.' }, { status: 400 });
  }

  const englishTerms = await getNicheTerms('English');

  try {
    const translated = await translateTerms(englishTerms, targetLanguage);
    if (translated.length === 0) {
      return NextResponse.json({ error: 'Translation returned no usable results.' }, { status: 502 });
    }
    const terms = await setNicheTerms(targetLanguage, translated);
    return NextResponse.json({ language: targetLanguage, terms, translatedCount: translated.length, requestedCount: englishTerms.length });
  } catch (err) {
    if (err instanceof TranslationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Translation failed.' }, { status: 500 });
  }
}
