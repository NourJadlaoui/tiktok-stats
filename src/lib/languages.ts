// ISO 639-3 code -> display name, for the languages commonly detected on TikTok.
// Kept separate from langDetect.ts (which pulls in the franc library) so
// client components can list language options without bundling franc.
export const LANGUAGE_CODES: Record<string, string> = {
  eng: 'English',
  spa: 'Spanish',
  fra: 'French',
  por: 'Portuguese',
  arb: 'Arabic',
  ind: 'Indonesian',
  deu: 'German',
  ita: 'Italian',
  hin: 'Hindi',
  jpn: 'Japanese',
  kor: 'Korean',
  tur: 'Turkish',
  vie: 'Vietnamese',
  tha: 'Thai',
  rus: 'Russian',
  cmn: 'Chinese',
  nld: 'Dutch',
  pol: 'Polish',
  ukr: 'Ukrainian',
  ron: 'Romanian',
  ell: 'Greek',
  swe: 'Swedish',
  fil: 'Filipino',
  urd: 'Urdu',
  ben: 'Bengali',
  pes: 'Persian',
  heb: 'Hebrew',
  msa: 'Malay'
};

export const LANGUAGE_NAMES = [...new Set(Object.values(LANGUAGE_CODES))].sort();
