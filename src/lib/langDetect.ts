import { franc } from 'franc';
import { LANGUAGE_CODES } from './languages';

/**
 * Detects the dominant language of a block of text using franc (offline,
 * open-source, trigram-based — no external API/network call). Returns a
 * human-readable language name, or "Unknown" if the text is too short or
 * ambiguous to classify confidently.
 *
 * Restricted to the languages in LANGUAGE_CODES so franc doesn't confuse
 * close-relative languages (e.g. classifying English as Scots), which
 * happens often with its full ~186-language model on short text.
 */
export function detectLanguage(text: string): string {
  const cleaned = text
    .replace(/#[\p{L}0-9_]+/gu, ' ') // strip hashtags
    .replace(/@[\w.]+/g, ' ') // strip mentions
    .replace(/https?:\/\/\S+/g, ' ')
    .trim();

  if (cleaned.length < 10) return 'Unknown';

  const code = franc(cleaned, { only: Object.keys(LANGUAGE_CODES), minLength: 10 });
  if (code === 'und') return 'Unknown';
  return LANGUAGE_CODES[code] ?? 'Unknown';
}

/** Detects language from a channel's bio plus a sample of its video titles. */
export function detectChannelLanguage(bio: string, sampleTitles: string[]): string {
  const combined = [bio, ...sampleTitles.slice(0, 25)].join('. ');
  return detectLanguage(combined);
}
