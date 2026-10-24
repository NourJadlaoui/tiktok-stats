/**
 * Curated candidate search terms for Niche Finder's automated scan, grouped
 * by language. There's no live "what's trending on TikTok right now" API to
 * pull from, so this is a static, evergreen list of popular content
 * categories/topics instead — the Niche Score for each is still computed
 * from a real, fresh scan every run, so demand/momentum/competition numbers
 * are current even though the *list of topics considered* isn't.
 *
 * English has the fullest list. Other languages have a smaller curated set
 * of local-language equivalents; languages without one fall back to the
 * English list (English hashtags are searched globally regardless of a
 * video's spoken language, so it still surfaces real results — just biased
 * toward English-speaking creators). Feel free to edit these lists directly
 * to focus Niche Finder on categories you care about.
 */

export const NICHE_TERMS_BY_LANGUAGE: Record<string, string[]> = {
  English: [
    'fitness motivation', 'home workout', 'weight loss journey', 'bodybuilding', 'yoga flow', 'running tips',
    'easy recipes', 'meal prep', 'baking', 'healthy eating', 'street food',
    'skincare routine', 'makeup tutorial', 'hair styling', 'nail art', 'outfit ideas', 'thrift flip',
    'personal finance', 'investing tips', 'side hustle', 'crypto news', 'budgeting tips', 'passive income',
    'comedy skits', 'prank videos', 'relatable memes',
    'gaming highlights', 'gameplay clips', 'mobile gaming',
    'tech review', 'gadget unboxing', 'coding tips', 'productivity hacks', 'ai tools',
    'pet tricks', 'dog training', 'cat videos',
    'travel vlog', 'budget travel', 'hidden gems travel',
    'diy crafts', 'home decor', 'cleaning hacks', 'organization tips',
    'parenting tips', 'mom life', 'study tips', 'language learning', 'book review', 'movie review',
    'anime edit', 'cosplay', 'dance challenge', 'music cover',
    'car review', 'sneaker review', 'football skills', 'basketball highlights',
    'mental health tips', 'self improvement', 'motivational quotes', 'spirituality', 'astrology',
    'gardening tips', 'sustainable living', 'asmr', 'life hacks'
  ],
  Spanish: [
    'motivacion fitness', 'rutina en casa', 'perder peso', 'yoga', 'recetas fáciles', 'comida callejera',
    'rutina de skincare', 'tutorial de maquillaje', 'peinados', 'uñas decoradas', 'outfits', 'moda',
    'finanzas personales', 'invertir', 'negocio propio', 'criptomonedas', 'ahorrar dinero',
    'sketches de comedia', 'memes', 'bromas',
    'gaming en español', 'videojuegos', 'tecnología', 'trucos de productividad',
    'entrenamiento de perros', 'gatos graciosos', 'mascotas',
    'viajar barato', 'vlog de viaje', 'manualidades', 'decoración de casa', 'limpieza y organización',
    'consejos para mamás', 'tips de estudio', 'reseña de libros', 'reseña de películas',
    'baile challenge', 'cover de canciones',
    'motivación personal', 'salud mental', 'astrología', 'huerto en casa', 'vida sostenible'
  ],
  French: [
    'motivation fitness', 'sport à la maison', 'perte de poids', 'yoga', 'recettes faciles', 'street food',
    'routine skincare', 'tutoriel maquillage', 'coiffure', 'nail art', 'idées de tenues', 'mode',
    'finances personnelles', 'investir', 'business en ligne', 'crypto monnaie', 'astuces budget',
    'sketchs comiques', 'memes', 'prank',
    'gaming', 'jeux vidéo', 'tech review', 'astuces productivité',
    'dressage de chien', 'chats trop mignons', 'animaux de compagnie',
    'voyage pas cher', 'vlog voyage', 'diy', 'décoration maison', 'astuces ménage',
    'astuces pour mamans', 'astuces études', 'critique de livre', 'critique de film',
    'défi de danse', 'reprise musicale',
    'développement personnel', 'santé mentale', 'astrologie', 'jardinage', 'vie durable'
  ],
  Portuguese: [
    'motivação fitness', 'treino em casa', 'perder peso', 'yoga', 'receitas fáceis', 'comida de rua',
    'rotina de skincare', 'tutorial de maquiagem', 'penteados', 'unhas decoradas', 'looks', 'moda',
    'finanças pessoais', 'investimentos', 'renda extra', 'criptomoedas', 'dicas de economia',
    'esquetes de comédia', 'memes', 'pegadinhas',
    'gameplay', 'jogos', 'tecnologia', 'dicas de produtividade',
    'adestramento de cachorro', 'gatos engraçados', 'pets',
    'viagem barata', 'vlog de viagem', 'faça você mesmo', 'decoração de casa', 'dicas de limpeza',
    'dicas para mães', 'dicas de estudo', 'resenha de livro', 'crítica de filme',
    'desafio de dança', 'cover de música',
    'desenvolvimento pessoal', 'saúde mental', 'astrologia', 'jardinagem', 'vida sustentável'
  ],
  German: [
    'fitness motivation', 'workout zuhause', 'abnehmen', 'yoga', 'einfache rezepte',
    'skincare routine', 'make up tutorial', 'frisur ideen', 'nageldesign', 'outfit ideen', 'mode',
    'finanzen tipps', 'investieren', 'nebenverdienst', 'kryptowährung', 'spartipps',
    'comedy sketch', 'memes', 'streiche',
    'gaming', 'gameplay', 'technik review', 'produktivität tipps',
    'hundetraining', 'lustige katzen', 'haustiere',
    'günstig reisen', 'reise vlog', 'diy', 'wohnideen', 'putztipps',
    'mama tipps', 'lerntipps', 'buchrezension', 'filmkritik',
    'tanz challenge', 'musik cover',
    'persönlichkeitsentwicklung', 'mentale gesundheit', 'astrologie', 'gartentipps', 'nachhaltig leben'
  ],
  Italian: [
    'motivazione fitness', 'allenamento a casa', 'perdere peso', 'yoga', 'ricette facili',
    'skincare routine', 'tutorial trucco', 'acconciature', 'nail art', 'idee outfit', 'moda',
    'finanza personale', 'investire', 'secondo lavoro', 'criptovalute', 'consigli risparmio',
    'sketch comici', 'meme', 'scherzi',
    'gaming', 'gameplay', 'recensione tech', 'consigli produttività',
    'addestramento cane', 'gatti divertenti', 'animali domestici',
    'viaggiare low cost', 'vlog di viaggio', 'fai da te', 'idee arredamento', 'consigli pulizie',
    'consigli per mamme', 'consigli di studio', 'recensione libro', 'recensione film',
    'dance challenge', 'cover musicali',
    'crescita personale', 'salute mentale', 'astrologia', 'giardinaggio', 'vita sostenibile'
  ]
};

const DEFAULT_LANGUAGE = 'English';

/** Returns the built-in curated list for a language, or the English list as a
 * fallback for languages with no curated set of their own yet. */
export function getBuiltInTermsForLanguage(language: string): string[] {
  return NICHE_TERMS_BY_LANGUAGE[language] ?? NICHE_TERMS_BY_LANGUAGE[DEFAULT_LANGUAGE];
}

/** `overrides` (a language -> full term list map, e.g. from the Settings
 * page's editable list) takes priority over the built-in curated list for
 * any language it covers — this is how user add/edit/delete/translate
 * actions in Settings actually change what Niche Finder scans. */
export function getNicheTermsForLanguages(
  languages: string[],
  overrides?: Record<string, string[]>
): { term: string; language: string }[] {
  const seen = new Set<string>();
  const out: { term: string; language: string }[] = [];

  for (const language of languages) {
    const terms = overrides?.[language]?.length ? overrides[language] : getBuiltInTermsForLanguage(language);
    for (const term of terms) {
      const key = term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ term, language });
    }
  }

  return out;
}

export const COVERAGE_LEVELS = {
  quick: 12,
  standard: 25,
  full: Infinity
} as const;

export type CoverageLevel = keyof typeof COVERAGE_LEVELS;

export function applyCoverage(
  terms: { term: string; language: string }[],
  coverage: CoverageLevel
): { term: string; language: string }[] {
  const limit = COVERAGE_LEVELS[coverage];
  if (!Number.isFinite(limit)) return terms;

  // Take up to `limit` terms per language, preserving the curated order
  // (roughly most broadly popular first) rather than just truncating the
  // combined list, so a multi-language run still covers each language.
  const byLanguage = new Map<string, { term: string; language: string }[]>();
  for (const t of terms) {
    if (!byLanguage.has(t.language)) byLanguage.set(t.language, []);
    byLanguage.get(t.language)!.push(t);
  }
  return [...byLanguage.values()].flatMap((list) => list.slice(0, limit));
}
