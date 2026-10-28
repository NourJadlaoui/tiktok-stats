# Audit technique — NicheTok.io (ex-TikTok Stats)

Date de l'audit : 2026-10-28
Portée : Phase 1 du cahier des charges (`README-NicheTok.md`) — cartographie et preuves, pas encore de correctifs appliqués.
Décisions déjà actées par le produit : rebrand en **NicheTok.io** approuvé ; domaine de production **non décidé** (à centraliser derrière une seule variable d'env en attendant).

---

## 0. État initial

- **Stack** : Next.js 15.5.20 (App Router), React 18.3, TypeScript 5.5, Tailwind 3.4, Supabase (`@supabase/ssr` + `@supabase/supabase-js`), Stripe, Zod, Playwright 1.61, `recharts`.
- **Scripts disponibles** (`package.json`) : `dev`, `build`, `start`, `lint`, `typecheck`. **Aucun test runner n'est installé** (pas de Jest/Vitest/Playwright Test dans `devDependencies`) — il n'existe donc aucune commande `test` à exécuter aujourd'hui. Toute mention de "tests" ci-dessous est donc à comprendre comme `npm run typecheck` + `npm run build` + vérification manuelle, jusqu'à ce qu'un runner soit ajouté explicitement (non fait dans cet audit, décision à valider).
- `npx tsc --noEmit` et `npm run build` passent actuellement sans erreur sur `main`/la branche de travail (vérifié avant cet audit, lors des rounds précédents).
- Branche courante : `claude/tiktok-analytics-dashboard-idne3g`.

---

## 1. Design system — couleurs et thème

**Système réel** : Tailwind utility classes, pas de shadcn/radix, pas de CSS Modules. `darkMode: 'class'`, togglé via un script inline dans `layout.tsx` + `localStorage`.

### Constat principal : palette `brand` incohérente

`tailwind.config.ts:9-20` :
```ts
brand: {
  50: '#fdf2f8',  // rose très clair
  ...
  500: '#ec4899', // rose
  600: '#25F4EE', // ← cyan TikTok, rupture de la progression de la teinte
  700: '#0d9488', // teal
  800: '#115e59', // teal foncé
  900: '#134e4a'  // teal très foncé
}
```
`brand-600` casse la progression rose→rose foncé attendue d'une échelle Tailwind — c'est très probablement un copier-coller de la couleur d'accent `tiktok.cyan`. Toute classe `bg-brand-600`/`ring-brand-600`/`text-brand-600` (utilisée notamment sur les focus rings de formulaires, ex. `AccountSearchBox.tsx:26`, `ChannelSettingsForm.tsx`) rend donc un cyan vif au lieu d'un rose cohérent avec le reste de l'échelle.

### Pas de tokens centralisés

Aucune variable CSS custom property (`--color-*`) n'existe dans `globals.css`. Les couleurs "surface", "texte secondaire", "bordure" etc. sont référencées au cas par cas via les classes Tailwind brutes (`neutral-50`…`neutral-950`), avec des choix qui varient d'un composant à l'autre (ex. certaines cartes utilisent `dark:bg-neutral-900`, d'autres `dark:bg-neutral-800`, sans règle écrite). Les couleurs de marque (`#25f4ee`, `#fe2c55`) sont en plus dupliquées en dur dans `globals.css` (gradient-text, gradient-border, btn-sheen) au lieu de référencer `tailwind.config.ts`.

**Recommandation (non appliquée)** : définir des tokens sémantiques (`surface`, `surface-elevated`, `text-secondary`, `border-default`, `accent`, `accent-secondary`, `success`, `warning`, `danger`, `info`, `focus-ring`) soit via l'extension Tailwind existante (en corrigeant d'abord `brand-600`), soit via des CSS custom properties consommées par Tailwind — à trancher selon préférence, mais sans ajouter un deuxième système parallèle.

---

## 2. Dropdowns / `<select>`

12 fichiers utilisent un `<select>` natif HTML — **aucune librairie de dropdown custom** (pas de Radix/shadcn `Select`, pas de `Combobox`/`Popover`) :

```
NicheResultsTable.tsx, TrackedDashboard.tsx, NicheFinderResultsTable.tsx,
settings/SyncCurrencySettings.tsx, settings/NicheTermsManager.tsx, AccountsTable.tsx,
CalendarView.tsx, ProfileHistoryCard.tsx, ChannelSettingsForm.tsx, VideosTable.tsx,
app/niche-finder/page.tsx, app/niche/page.tsx
```

Bonne nouvelle : avec des `<select>` natifs, les risques de z-index/portail/debordement (section 1B du cahier des charges) sont largement écartés — le menu est rendu par l'OS, pas par React. Les points qui restent à vérifier concrètement (pas encore fait) :
- cohérence des classes de style entre les 12 fichiers (certains ont `dark:bg-neutral-900` sans `dark:text-*` explicite, ce qui peut laisser le texte en noir sur fond sombre selon le navigateur) ;
- présence d'un `<label>` ou d'un texte visible associé à chaque `<select>` (plusieurs n'ont qu'un `placeholder`/contexte visuel, pas de `aria-label` explicite) ;
- focus visible (`focus:ring-2` est présent sur la plupart, mais pas vérifié partout).

Pas de preuve de bug fonctionnel (sélection perdue, valeur dupliquée) trouvée dans cette passe — à confirmer par un test manuel par composant si on va plus loin.

---

## 3. Inventaire des appels fournisseur (matrice)

| Fonctionnalité | Service métier | Fournisseur réel | Fallback |
|---|---|---|---|
| Profil TikTok (dashboard) | `src/lib/channel.ts` → `getDataProvider()` | `rapidapi.ts` (si `DATA_PROVIDER=rapidapi` **et** clé présente), sinon `tiktokWeb.ts` (scraper Playwright) | **Oui, silencieux** — voir §4 |
| Niche Stats (`/niche`, recherche par mot-clé) | `src/lib/nicheSearch.ts` | `dataProviders/tiktokSearch.ts` → **Playwright uniquement**, ne passe jamais par `getDataProvider()`/RapidAPI | N/A (pas de fournisseur alternatif codé) |
| Niche Finder (`/niche-finder`, scan multi-termes) | `src/lib/nicheFinder.ts` → `nicheSearch.ts` | Même chemin que ci-dessus → **Playwright** | idem |
| Bulk scan | `src/lib/bulkScan.ts` (à auditer plus en détail si on avance) | passe par `channel.ts`/`getChannelData` a priori → même chemin que Profil TikTok | à confirmer |

**Confirmation du soupçon du cahier des charges** : la récupération de profil individuel (RapidAPI, quand configuré) et la recherche par mot-clé (Niche Stats / Niche Finder, toujours Playwright) **n'utilisent pas la même couche fournisseur**. `tiktokSearch.ts` n'appelle jamais `getDataProvider()` — il n'existe donc aujourd'hui aucun moyen de faire tourner la recherche par mot-clé sur RapidAPI même si une clé est configurée, puisque RapidAPI (`tiktok-scraper7`) n'expose vraisemblablement pas d'endpoint de recherche par mot-clé équivalent — **à vérifier avant de promettre une unification**, ce n'est pas forcément un bug mais une limite réelle du fournisseur à documenter plutôt qu'à "corriger" aveuglément.

---

## 4. Fallback silencieux confirmé

`src/lib/config.ts:129-132` :
```ts
if (merged.dataProvider === 'rapidapi' && !merged.rapidApi.key) {
  console.warn('[config] dataProvider=rapidapi but no RAPIDAPI_KEY configured — falling back to the built-in TikTok scraper.');
  merged.dataProvider = 'tiktok';
}
```
C'est exactement le cas que le cahier des charges demande d'éliminer (§2.4) : une clé RapidAPI absente fait basculer silencieusement vers le scraper Playwright, avec uniquement un `console.warn` serveur — invisible pour l'utilisateur et pour l'admin sauf à lire les logs du conteneur. Le champ `provider` retourné à l'UI (`'tiktok'` vs `'rapidapi'`, affiché dans `ProfileHeader.tsx` comme badge "Live data (RapidAPI)" / "Live data") reste cohérent avec la réalité — ce n'est donc pas un mensonge fait à l'utilisateur final, mais l'opérateur du service peut croire que RapidAPI est actif alors qu'il ne l'est pas, sans alerte.

**Recommandation (non appliquée)** : soit échouer explicitement au démarrage si `DATA_PROVIDER=rapidapi` est demandé sans clé (comportement strict demandé par le cahier des charges), soit a minima remonter cet état dans une page/endpoint d'admin visible plutôt qu'un simple log serveur. Décision produit à trancher (le comportement actuel — dégrader plutôt que planter tout le service — a aussi un intérêt opérationnel ; à soupeser avec vous avant de changer).

---

## 5. Isolation de la progression des jobs

`src/lib/scrapeProgress.ts` (38 lignes, confirmé en entier) :
```ts
function store(): Map<string, ScrapeProgress> {
  if (!globalThis.__tiktokScrapeProgress) globalThis.__tiktokScrapeProgress = new Map();
  return globalThis.__tiktokScrapeProgress;
}
export function setProgress(username: string, update: ...) { store().set(username, ...) }
export function getProgress(username: string) { return store().get(username) }
```
La map est **globale au process Node**, indexée uniquement par `username` — pas par `userId` ni par `jobId`. Conséquence concrète : si deux comptes différents lancent un scan du **même** `@username` au même moment, ils partagent et s'écrasent mutuellement l'état de progression (l'un peut voir "terminé" pendant que son propre scan est encore à 20 %, ou l'inverse). C'est exactement le risque identifié au §3 du cahier des charges ("deux utilisateurs qui lancent deux analyses simultanées ne doivent jamais voir la progression... l'un de l'autre").

Impact pratique aujourd'hui : modéré (il faut que deux comptes différents scannent le même username à la même seconde), mais c'est un vrai bug de confidentialité/correction, pas une hypothèse.

**Recommandation (non appliquée)** : clé composite `${userId}:${username}` (ou `jobId` dédié) au lieu de `username` seul. Changement localisé (ce fichier + les deux call-sites `setProgress`/`getProgress` dans `rapidapi.ts`/`tiktokWeb.ts` et la route `/api/profile/[username]/progress`), mais implique de faire circuler `userId` jusqu'au provider, qui ne l'a pas aujourd'hui.

Par ailleurs, cette map est **en mémoire du process** — en cas de déploiement multi-instance (plusieurs conteneurs derrière un load balancer), le poll de progression peut taper une instance qui n'a jamais vu ce job. Le cahier des charges demande un "stockage d'état durable" pour les traitements longs (§3) si l'architecture le justifie — à trancher selon si un déploiement multi-instance est prévu (actuellement : un seul conteneur OVH, donc pas urgent, mais à noter).

---

## 6. Popup de rechargement / quota (`UpgradeModal`)

Déclenchement audité dans les 6 points d'appel (`AccountSearchBox.tsx`, `app/page.tsx`, `dashboard/[username]/layout.tsx`, `niche/page.tsx`, `bulk/page.tsx`, plus le composant lui-même qui s'auto-fetch les plans). Le pattern est **cohérent et déjà correct** sur les flux audités : la modale ne s'ouvre que sur `res.status === 402` (ou l'exception serveur `PlanLimitError` côté `layout.tsx`), jamais sur une erreur réseau générique ou un `catch` attrape-tout. Exemple (`bulk/page.tsx`) : le `catch` générique met à jour un état d'erreur texte distinct, pas la modale.

Pas de preuve de double-ouverture, de double-soumission ou de boucle trouvée dans cette passe — `UpgradeModal.tsx` désactive bien le bouton pendant `loadingId !== null`. Pas d'anomalie confirmée ici contrairement à l'hypothèse initiale du cahier des charges ; à re-tester manuellement si un bug précis vous a été rapporté (vous n'en avez pas mentionné un dans nos échanges précédents sur ce point spécifique).

---

## 7. Docker / fichiers exposés

- `Dockerfile:36` : `COPY --from=builder /app/public ./public` — **le dossier `public/` n'existe pas dans le dépôt** (confirmé : ni suivi par git, ni présent sur disque). Le projet gère favicon/OG image via les fichiers spéciaux Next.js `src/app/icon.tsx` et `src/app/opengraph-image.tsx`, pas via `public/`. Cette ligne `COPY` va donc **faire échouer le build Docker** avec "no such file or directory" si ce chemin de déploiement est utilisé. Ce n'est probablement pas ce qui a été utilisé pour le déploiement OVH actuel (le Dockerfile documente lui-même un second chemin "PM2 + Nginx direct install", vraisemblablement celui réellement utilisé) — mais c'est un bug confirmé si jamais le chemin Docker est tenté.
- `.dockerignore` exclut correctement `node_modules`, `.next`, `.git`, `.env*`, `data`, `*.log`. Il n'exclut pas explicitement `config/credentials.json` par son nom — mais comme la sortie finale utilise `output: 'standalone'` et que seuls `.next/standalone`, `.next/static` et `public` sont copiés dans l'image finale (pas le `config/` du répertoire source), `credentials.json` ne devrait pas se retrouver dans l'image runtime tant que rien ne le lit au runtime via un chemin absolu — cohérent avec le choix déjà fait par le projet de privilégier les variables d'env en production (voir `config.ts`, chaque valeur a un override `process.env.*`).

**Recommandation (non appliquée)** : soit créer un `public/.gitkeep` et ajuster le `COPY` pour tolérer son absence (`COPY --from=builder /app/public* ./public` avec le comportement "best effort" de Docker sur wildcard), soit retirer la ligne si le projet n'a vraiment besoin de rien dans `public/`. Décision rapide, faible risque.

---

## 8. SEO — domaine et métadonnées

- `src/app/layout.tsx:11` : `const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';` — **placeholder résiduel confirmé**, utilisé pour `metadataBase`, Open Graph `url`, et consommé indirectement par `sitemap.ts`/`robots.ts`. Décision produit : domaine non encore choisi (acté dans cette session) — la variable d'env existe déjà et est le bon point central ; il suffira de la renseigner en production (`NEXT_PUBLIC_SITE_URL=https://<domaine final>`) sans toucher au code une fois le domaine choisi.
- Titre/branding actuels : "TikTok Stats — TikTok Analytics & Creator Growth Dashboard" (`layout.tsx:12-13`), repris dans `openGraph.siteName`, `metadata.title.template`, et vraisemblablement dans `TopNav.tsx`, les emails et d'autres composants non encore grep-és — **rebrand en NicheTok.io acté mais pas encore appliqué** (prochaine étape si vous donnez le feu vert).
- `sitemap.ts`/`robots.ts` existent déjà comme fondation (non audités ligne à ligne dans cette passe — à faire avant la Phase 4 du cahier des charges).
- Pages `dashboard/`, `admin/`, `login/` : pas encore vérifié si elles portent un `robots: { index: false }` explicite par page (le `metadata.robots` global dans `layout.tsx:40` est `{ index: true, follow: true }` pour tout le site — **à vérifier/corriger**, chaque page privée doit normalement surcharger ça explicitement, sinon elle hérite d'`index: true`).

---

## 9. Absences confirmées (pas des bugs — du travail neuf, pas encore commencé)

- **Free Tools** (`/free-tools/*`) : aucune route, aucun composant existant. À construire entièrement (§5 du cahier des charges).
- **Admin éditorial (guides/blog/FAQ)** : `src/app/admin/` contient uniquement la gestion utilisateurs/stats/plans (`page.tsx`, `[userId]/page.tsx`) — aucun modèle de contenu, aucun CRUD articles. À construire entièrement (§7).
- **FAQ administrable** : inexistante.

---

## 10. Synthèse priorisée (proposition, à valider avant exécution)

| # | Item | Effort estimé | Risque si non fait |
|---|---|---|---|
| 1 | Corriger `brand-600` + définir des tokens sémantiques minimaux | Faible-moyen | Visuel incohérent persistant |
| 2 | Corriger le `COPY public` du Dockerfile (bug de build confirmé) | Très faible | Déploiement Docker cassé |
| 3 | Isolation de la progression des jobs par utilisateur (pas seulement username) | Faible-moyen | Fuite de progression entre comptes |
| 4 | Audit fin des 12 `<select>` (labels, contraste dark mode) | Faible | Accessibilité/lisibilité |
| 5 | `noindex` explicite sur dashboard/admin/login + vérif sitemap/robots | Faible | Pages privées indexables |
| 6 | Rebrand NicheTok.io (titres, nav, metadata, emails) | Moyen (beaucoup de fichiers, peu de risque chacun) | — (déjà approuvé, en attente du go) |
| 7 | Domaine de prod → `NEXT_PUBLIC_SITE_URL` | Trivial une fois le domaine connu | SEO cassé tant que non réglé |
| 8 | Rendre le fallback RapidAPI→Playwright visible (pas juste un `console.warn`) | Faible-moyen | Confusion opérationnelle, pas un bug utilisateur |
| 9 | Free Tools (hub + calculateur d'engagement manuel d'abord) | Élevé | Fonctionnalité demandée absente |
| 10 | Admin éditorial (modèle de contenu + CRUD + pages publiques) | Élevé | Fonctionnalité demandée absente |
| 11 | Unification/clarification Niche Search vs RapidAPI (probablement : documenter la limite plutôt que forcer une fausse unification) | Investigation d'abord | Attentes mal calibrées |

Les items 1-8 sont des corrections ciblées, chacune indépendante et peu risquée. Les items 9-10 sont des constructions neuves substantielles (plusieurs sessions chacune). L'item 11 nécessite de vérifier ce que l'endpoint RapidAPI souscrit expose réellement avant de décider quoi que ce soit.

**Aucun correctif n'a été appliqué dans cette passe** — ce document est la livraison de l'étape "audit" demandée. Dites-moi par quoi commencer (je recommande 1-2-3-5 d'abord : rapides, sans risque, et ils corrigent des bugs réels déjà confirmés) et j'enchaîne.
