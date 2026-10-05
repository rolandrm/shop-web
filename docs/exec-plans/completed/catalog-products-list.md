# Plan d'exécution : catalog-products-list

- **Statut** : COMPLETED
- **Taille** : M
- **Points d'arrêt** : aucun
  **Note** : l'humain approuve ce plan en tapant `/harness:ship docs/specs/catalog-products-list.md --continue` ; il passe `COMPLETED` sur preuve en fin de cycle (toutes les cases cochées, `harness verify` vert).

- **Spec** : `docs/specs/catalog-products-list.md` (Approved, v0.2.0, révision 1)
- **Règles** : `.claude/rules/nextjs/` (features, feature-server, feature-client, model-schemas, app-routes, i18n, ui, testing, shared, verification)
- **Contrat consommé** : `docs/api/backends/shop-api.openapi.json`, opération `CatalogController_listProducts_v1` (`limit` 1..100 défaut 20, `cursor` 1..200 `^[A-Za-z0-9_-]+$`, `currency` `EUR|USD|GBP`)
- **Révisions du plan** :
  - 1 — 2026-10-05 — `harness verify` : 9 vérifications vertes et 1 rouge (`web:build`).
    Pendant la collecte des pages de `/[locale]/products`, Next.js importe
    `src/shared/config/env.server.ts`, qui valide `BACKEND_API_URL` **au chargement du
    module** et lève une erreur faute de `.env` (la CI ne définit pas la variable). Le
    build dépend donc d'une variable d'exécution. Décision humaine (option C) : lecture
    à la demande (`getServerEnv()` mémorisé) et validation au démarrage du serveur par
    `src/instrumentation.ts`. Ajout de l'étape 5 ; les étapes 1 à 4, faites, sont
    inchangées.

## Questions à l'humain

Les quatre questions ont reçu une réponse et sont intégrées à la spec v0.2.0 (révision 1).

1. **`shared/i18n/request.ts` ne peut pas charger `src/features/catalog/messages/`.**
   `shared/` ne connaît aucune feature : invariant `next-shared-knows-nothing` et règle
   dependency-cruiser `shared-knows-nothing`. Solution : `src/shared/i18n/request.ts`
   devient une fabrique générique `createRequestConfig(loadFeatureMessages)` ; la
   feature expose `loadCatalogMessages(locale)` dans `index.ts` ; le point d'entrée
   next-intl passe dans `src/app/_i18n/request.ts` ; `next.config.ts` pointe vers lui.
   **Réponse : oui.**
2. **`"use client"` dans `src/app/[locale]/products/error.tsx`**, imposé par Next.js
   pour un `error.tsx` (composant feuille, modèle `src/app/[locale]/error.tsx`).
   **Réponse : oui.** La variante (ne pas créer ce fichier) est écartée.
3. **Composant synchrone `CatalogLink`** dans la feature, composé par l'accueil et
   testé par T14. **Réponse : oui.**
4. **Clés `errors.BACKEND_TIMEOUT` et `errors.BACKEND_UNAVAILABLE`** (fr et en) dans
   `messages/*.json`, pour rendre T13 discriminant. **Réponse : oui.**

## Écarts acceptés par l'humain

- **Étape 4 : `export { productsSearchParamsSchema }` ajouté à
  `src/features/catalog/server.ts`.** `page.tsx` doit parser `searchParams` par ce
  schéma, et `app/` n'importe que `features/catalog` et `features/catalog/server`
  (`next-app-feature-public-api-only`). Le plan ne prévoyait pas cette réexportation.
  Écart accepté le 2026-10-05.

## Constat de départ (code lu)

- Socle présent : `backendRequest<T>(path, { schema, locale, ... })` dans
  `src/shared/api/backend-client.ts` (`server-only`, `cache: "no-store"`, délai 5 s,
  `BackendError = { code, status }`, ne lève jamais) ; `Result`/`ok`/`err` dans
  `src/shared/lib/result.ts` ; `formatMoney(amount, currency, locale)` dans
  `src/shared/lib/money.ts` ; `Link` dans `src/shared/i18n/navigation.ts`
  (`createNavigation(routing)`) ; `routing` (`fr`, `en`, défaut `fr`).
- `src/shared/i18n/request.ts` : `getRequestConfig` qui charge
  `messages/<locale>.json` seul ; `next.config.ts` :
  `createNextIntlPlugin("./src/shared/i18n/request.ts")`.
- `src/app/[locale]/layout.tsx` : `<NextIntlClientProvider>` sans `messages` explicites
  (next-intl 4 les hérite de la config de requête) ; `generateMetadata` via
  `getTranslations`.
- `src/app/[locale]/page.tsx` : accueil asynchrone, namespace `common`.
- Aucun `src/features/` à ce jour.
- Tests existants : `src/shared/lib/money.test.ts`, `src/shared/config/env.server.test.ts`,
  `src/shared/api/backend-client.test.ts` (modèle MSW : `// @vitest-environment node`,
  `setupServer()`, `server.listen({ onUnhandledFrame: "error" })`, base
  `http://backend.test`), `src/shared/i18n/routing.test.ts`, `src/proxy.test.ts`,
  `src/app/[locale]/error.test.tsx` (modèle composant : `NextIntlClientProvider` +
  vrais `messages/*.json`), `src/app/api/health/route.test.ts`.
- `vitest.config.ts` : jsdom par défaut, alias `@` et `server-only`,
  `server.deps.inline: ["next-intl"]`, `BACKEND_API_URL=http://backend.test`.
- `scripts/i18n-check.mjs` vérifie déjà `src/features/*/messages/` (parité T15) ;
  `.dependency-cruiser.cjs` porte `no-cross-feature`, `app-uses-feature-public-api-only`,
  `shared-knows-nothing`, `client-api-never-reexports-server`, `model-is-pure`.
- `harness.config.json` : `typecheck`, `test`, `build`, `lint`, `lint:architecture`
  déclarés ; `paths.generated` vide.
- Aucune dépendance à installer (spec, « Dépendances »).

### Constat pour l'étape 5 (révision 1, code lu)

- `src/shared/config/env.server.ts` : `import "server-only"`, schéma Zod
  (`BACKEND_API_URL: z.url()`, `NODE_ENV` énuméré), `parseServerEnv(source)` lève
  `Invalid server environment: BACKEND_API_URL: …`, et
  `export const serverEnv = parseServerEnv(process.env)` évalué au chargement.
- Seul usage de `serverEnv` dans `src/` : `src/shared/api/backend-client.ts` (import
  ligne 5, lecture `serverEnv.BACKEND_API_URL` ligne 62, dans `backendRequest`).
  `src/app/api/health/route.ts` n'en dépend pas.
- `src/shared/config/env.server.test.ts` : T1/T2 du socle sur `parseServerEnv`.
- Pas de `src/instrumentation.ts` ; aucun `.env` à la racine (seul `.env.example`).
- Next.js 16 (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`
  et `01-app/02-guides/instrumentation.md`) : `src/instrumentation.ts` (à côté de
  `app/`, pas dedans) ; `register()` (peut être `async`) est appelé **une fois au
  démarrage d'une instance serveur** et doit se terminer avant la première requête ;
  il est appelé dans tous les runtimes, d'où le test
  `process.env.NEXT_RUNTIME === "nodejs"` et l'import **dynamique** dans `register()`
  du code propre à Node.
- Invariant `next-no-process-env` : `process.env` uniquement dans `shared/config`.
  `src/instrumentation.ts` ne peut donc pas lire `process.env.NEXT_RUNTIME` lui-même.

## Décisions de conception prises par le plan

- **Messages de la feature** : `src/features/catalog/messages/<locale>.json` contient
  directement le corps du namespace (clés `title`, `empty`, `filterLabel`,
  `allCurrencies`, `nextPage`, `firstPage`, `viewCatalog`…), monté sous la clé
  `catalog` par `src/app/_i18n/request.ts`. Les tests de composants montent
  `{ ...messagesRacine, catalog: messagesFeature }` depuis les vrais fichiers.
- **Construction des liens** : `href = qs ? "/products?" + qs : "/products"`, avec
  `qs = productsSearchParams(...)` ; `Link` de `shared/i18n/navigation` ajoute la
  locale (`/fr/products?...`).
- **Erreur affichée** : `ProductListError({ code, currency? })` affiche
  `t("errors.<code>")` si `t.has` le confirme, sinon `errors.generic` (vérifier le nom
  de la méthode dans les types de `next-intl` installés) ; lien « Première page » vers
  `/products` avec la devise conservée si présente.
- **Pagination** : `ProductPagination({ currency?, cursor?, nextCursor })` ; « Page
  suivante » si `nextCursor`, « Première page » si `cursor`.
- **Handlers MSW** : `src/features/catalog/__mocks__/handlers.ts` exporte des fabriques
  de handlers sur le chemin `*/v1/products` (pas d'import de `serverEnv` dans les
  mocks) : liste de N produits avec `nextCursor`, vide, erreur 500/400 avec `code` et
  `message`, corps non conforme, lenteur ; un moyen d'inspecter les requêtes reçues
  (URL, en-têtes, nombre d'appels).
- **Paramètres d'URL** : schéma Zod par champ avec repli (`.catch(undefined)` ou
  équivalent Zod 4) pour qu'un champ invalide ou répété soit retiré sans invalider
  l'autre ; `currency` réutilise `CURRENCIES` de `model/`.
- **Contrat OpenAPI** : la feature ajoute une page HTML, pas une API ; ce repo ne publie
  pas `docs/api/openapi.json` et aucun invariant `openapi` n'est listé : aucun critère
  `harness gate openapi`.
- **Configuration serveur (révision 1)** :
  - `env.server.ts` conserve `parseServerEnv(source)` et remplace l'export `serverEnv`
    par `getServerEnv(): ServerEnv`, qui appelle `parseServerEnv(process.env)` au
    premier appel, mémorise le résultat dans une variable du module et le renvoie
    ensuite tel quel. Aucun appel au niveau du module.
  - Le runtime est lu dans `shared/config` (seul lieu autorisé pour `process.env`) :
    `src/shared/config/runtime.ts`, **sans** `server-only`, exporte
    `isNodeRuntime(): boolean` (`process.env.NEXT_RUNTIME === "nodejs"`).
  - `src/instrumentation.ts` : `export async function register()` ; si
    `isNodeRuntime()`, import dynamique de `@/shared/config/env.server` puis appel de
    `getServerEnv()` (une erreur levée fait échouer le démarrage, message nommant
    `BACKEND_API_URL`). Aucun import statique de `env.server` en tête du fichier
    (le fichier est aussi chargé hors runtime Node).
  - Tests : `vi.stubEnv` / `vi.unstubAllEnvs` pour poser ou retirer
    `BACKEND_API_URL` et `NEXT_RUNTIME` (pas d'écriture `process.env.X = …` dans les
    tests, cohérent avec `next-no-process-env` qui couvre `src/**`), et
    `vi.resetModules()` + import dynamique pour repartir d'un état non mémorisé
    entre deux cas. Vérifier dans la version installée de Vitest comment `vi.stubEnv`
    retire une variable (valeur `undefined`).

## Étapes

### Étape 1 — Modèle de vue et schémas Zod (TypeScript pur)

- **Fichiers** : `src/features/catalog/model/products.ts` (types `ProductListItem`,
  `ProductListPage`, `Currency`, constante `CURRENCIES`, fonction
  `productsSearchParams`), `src/features/catalog/model/products.test.ts`,
  `src/features/catalog/schemas/products.ts` (schéma de réponse `GET /v1/products`
  limité aux champs utilisés, `amount` en chaîne `^\d+\.\d{2}$`, `items` max 100 ;
  schéma des paramètres d'URL ; types par `z.infer`),
  `src/features/catalog/schemas/products.test.ts`
- **Critères de succès** :
  - [x] T1 passe : `{currency:"EUR",cursor:"abc"}` conservé tel quel ;
        `{currency:"JPY"}`, `{currency:"eur"}`, `{cursor:"$$"}`,
        `{currency:["EUR","USD"]}`, `{}` donnent `{}`
  - [x] T2 passe : corps conforme accepté ; prix `"12.5"` refusé ; corps sans
        `nextCursor` refusé
  - [x] T3 passe : `productsSearchParams` sur `{}`, `{currency:"EUR"}`,
        `{cursor:"abc"}`, `{currency:"EUR",cursor:"abc"}` renvoie `""`,
        `"currency=EUR"`, `"cursor=abc"`, `"currency=EUR&cursor=abc"`
  - [x] T17 (partie modèle) : `harness gate arch --rule next-model-pure` sort en 0
  - [x] T19 : `harness gate arch --rule next-no-amount-arithmetic` sort en 0
  - [x] `pnpm typecheck` et `pnpm test` sortent en 0
- **Durée estimée** : 20 min

### Étape 2 — Accès serveur : gateway, mapper, query et handlers MSW

- **Fichiers** : `src/features/catalog/server/gateway.ts` (`import "server-only"`,
  `listProducts({ currency, cursor, locale })` → `backendRequest` sur
  `/v1/products?<URLSearchParams>` avec `limit=20` puis `currency`/`cursor` s'ils sont
  présents), `src/features/catalog/server/mappers.ts` (+ `mappers.test.ts`),
  `src/features/catalog/server/queries.ts` (`getProductListPage` →
  `Result<ProductListPage, BackendError>`), `src/features/catalog/server/queries.test.ts`
  (`// @vitest-environment node`, `setupServer` avec les handlers de la feature,
  `onUnhandledFrame: "error"`), `src/features/catalog/server.ts` (`import "server-only"`,
  réexporte `getProductListPage`), `src/features/catalog/__mocks__/handlers.ts`
- **Critères de succès** :
  - [x] T4 passe : réponse de 2 produits et `nextCursor:"abc"` → `ProductListPage` de
        2 éléments (`id`, `name`, `amount`, `currency`) et `nextCursor:"abc"`
  - [x] T5 passe : `getProductListPage({locale:"fr"})` sur 20 produits → succès de 20
        éléments ; MSW reçoit un seul appel, `limit=20`, ni `currency` ni `cursor`,
        `Accept-Language: fr`
  - [x] T6 passe : `{locale:"fr",currency:"USD",cursor:"abc"}` → MSW reçoit `limit=20`,
        `currency=USD`, `cursor=abc`
  - [x] T7 passe : 500 `{"code":"INTERNAL_ERROR",...}` → `INTERNAL_ERROR`/500 ;
        400 `{"code":"VALIDATION_FAILED",...}` → `VALIDATION_FAILED`/400 ; corps non
        conforme → `INVALID_BACKEND_RESPONSE`/502 ; la promesse est résolue dans les
        trois cas
  - [x] un test passe : une requête vers un chemin sans handler fait échouer le test
        (preuve que `onUnhandledFrame: "error"` est actif dans `queries.test.ts`), par
        exemple en vérifiant que l'appel sans handler n'aboutit pas à un succès
  - [x] T18 : `harness gate arch --rule next-no-fetch-outside-api` sort en 0
  - [x] `harness gate arch --rule next-no-cross-feature` sort en 0
  - [x] `pnpm typecheck` et `pnpm test` sortent en 0 ; les tests de l'étape 1 et du
        socle passent sans modification
- **Durée estimée** : 35 min

### Étape 3 — Traductions, chargement des messages et composants

Lire avant d'écrire : la documentation next-intl 4 installée (`node_modules/next-intl/`)
pour `getRequestConfig`, `useTranslations` dans un Server Component synchrone et la
méthode `t.has`.

- **Fichiers** :
  - `src/features/catalog/messages/fr.json`, `src/features/catalog/messages/en.json`
    (mêmes clés, dont `viewCatalog`), `messages/fr.json`, `messages/en.json` (ajout de
    `errors.BACKEND_TIMEOUT` et `errors.BACKEND_UNAVAILABLE`)
  - `src/shared/i18n/request.ts` (fabrique
    `createRequestConfig(loadFeatureMessages: (locale) => Promise<Record<string, unknown>>)`,
    fusion avec `messages/<locale>.json`, repli sur la locale par défaut conservé,
    aucun import de feature), `src/shared/i18n/request.test.ts` (environnement `node`,
    chargeur factice passé en argument)
  - `src/app/_i18n/request.ts` (point d'entrée next-intl :
    `createRequestConfig(async (locale) => ({ catalog: await loadCatalogMessages(locale) }))`),
    `next.config.ts` (`createNextIntlPlugin("./src/app/_i18n/request.ts")`)
  - `src/features/catalog/components/product-list.tsx`, `currency-filter.tsx`,
    `product-pagination.tsx`, `product-list-empty.tsx`, `product-list-error.tsx`,
    `catalog-link.tsx`, un test par composant (`*.test.tsx`), aucun `"use client"`
  - `src/features/catalog/index.ts` (composants, types de vue, `loadCatalogMessages`
    par import dynamique de `./messages/<locale>.json`)
- **Critères de succès** :
  - [x] un test passe : la configuration produite par `createRequestConfig` pour `en`
        contient les clés `common`, `errors` de `messages/en.json` et la clé
        `catalog` fournie par le chargeur ; une locale inconnue retombe sur `fr`
  - [x] un test passe : `loadCatalogMessages("fr")` renvoie le contenu de
        `src/features/catalog/messages/fr.json` (clé `empty` présente)
  - [x] T8 passe : `ProductList` en `en` avec « Mug » à `1234.50 EUR` → un `listitem`
        contient « Mug » et `€1,234.50` (espaces insécables normalisés)
  - [x] T9 passe : `CurrencyFilter` en `fr` avec `currency:"USD"` → rôle `navigation`
        nommé par la traduction ; 4 liens vers `/fr/products`,
        `/fr/products?currency=EUR`, `/fr/products?currency=USD`,
        `/fr/products?currency=GBP` ; seul « USD » a `aria-current="page"` ; aucun
        `href` ne contient `cursor`
  - [x] T10 passe : `CurrencyFilter` sans devise → seul « Toutes les devises » a
        `aria-current="page"`
  - [x] T11 passe : `{currency:"EUR",cursor:"abc",nextCursor:"def"}` → « Page
        suivante » vers `/fr/products?currency=EUR&cursor=def` et « Première page »
        vers `/fr/products?currency=EUR` ; `{nextCursor:null}` sans `cursor` → aucun
        lien
  - [x] T12 passe : `ProductListEmpty` en `fr` affiche la valeur `empty` de
        `src/features/catalog/messages/fr.json`
  - [x] T13 passe : `ProductListError` avec `{code:"BACKEND_TIMEOUT"}` → `role="alert"`
        contenant le texte de `errors.BACKEND_TIMEOUT` de `messages/fr.json` ; avec
        `{code:"UNKNOWN_CODE"}` → texte de `errors.generic` ; lien « Première page »
        vers `/fr/products` dans les deux cas
  - [x] T14 passe : `CatalogLink` en `fr` → lien nommé par `catalog.viewCatalog`,
        `href` `/fr/products`
  - [x] T15 : `pnpm lint:architecture` sort en 0 (parité des traductions,
        dependency-cruiser dont `shared-knows-nothing`)
  - [x] `harness gate arch --rule next-shared-knows-nothing` et
        `harness gate arch --rule next-app-feature-public-api-only` sortent en 0
  - [x] T17 : `harness gate arch --rule next-index-client-safe` sort en 0
  - [x] T20 : `harness gate arch --rule next-i18n-navigation` sort en 0
  - [x] T21 (partie composants) : `harness gate arch --rule next-no-dangerous-html`
        sort en 0
  - [x] `pnpm lint` sort en 0 (aucun texte d'interface en dur, y compris `aria-label`)
  - [x] `pnpm typecheck` et `pnpm test` sortent en 0 ; `src/app/[locale]/error.test.tsx`
        et les tests des étapes 1 et 2 passent sans modification
- **Durée estimée** : 50 min

### Étape 4 — Route `/[locale]/products` et lien depuis l'accueil

Lire avant d'écrire : `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
(`searchParams` asynchrone), `loading.md`, `error.md`, et
`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`.

- **Fichiers** : `src/app/[locale]/products/page.tsx` (`setRequestLocale`, parse de
  `await searchParams` par le schéma des paramètres, un seul appel
  `getProductListPage`, un `h1` traduit, `CurrencyFilter`, puis `ProductListError` /
  `ProductListEmpty` / `ProductList` + `ProductPagination` ; `generateMetadata` avec
  `title` traduit), `src/app/[locale]/products/loading.tsx` (Server Component, texte
  traduit), `src/app/[locale]/products/error.tsx` (`"use client"`, composant feuille sur
  le modèle de `src/app/[locale]/error.tsx`, texte `errors.*`),
  `src/app/[locale]/page.tsx` (compose `CatalogLink`)
- **Critères de succès** :
  - [x] `pnpm build` sort en 0 et liste la route `/[locale]/products` comme dynamique
  - [x] T16 : `harness gate arch --rule next-no-cross-feature` et
        `harness gate arch --rule next-app-feature-public-api-only` sortent en 0
  - [x] T21 : `harness gate arch --rule next-no-use-client-on-routes` et
        `harness gate arch --rule next-no-dangerous-html` sortent en 0
  - [x] `harness gate arch --rule next-shared-knows-nothing`,
        `harness gate arch --rule next-no-fetch-outside-api` et
        `harness gate arch --rule next-no-amount-arithmetic` sortent en 0
  - [x] T22 : `pnpm lint`, `pnpm lint:architecture` et `pnpm typecheck` sortent en 0
  - [x] NFR poids client : seul `src/app/[locale]/products/error.tsx` porte la
        directive `"use client"` dans `src/features/catalog/` et
        `src/app/[locale]/products/` :
        `grep -rlE "^['\"]use client['\"]" src/features/catalog 'src/app/[locale]/products'`
        liste exactement ce fichier, et aucun autre
  - [x] `pnpm test` sort en 0 ; tous les tests des étapes 1 à 3 et du socle passent
        sans modification
- **Durée estimée** : 30 min

### Étape 5 — Configuration serveur lue à la demande, validée au démarrage (révision 1)

Lire avant d'écrire :
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`
et `node_modules/next/dist/docs/01-app/02-guides/instrumentation.md` (emplacement
`src/instrumentation.ts`, `NEXT_RUNTIME`, import dynamique dans `register()`).

- **Fichiers** :
  - `src/shared/config/env.server.ts` : `parseServerEnv` conservé ; `serverEnv`
    remplacé par `getServerEnv()` mémorisé ; plus aucune validation au chargement
  - `src/shared/config/runtime.ts` (sans `server-only`) : `isNodeRuntime()`
  - `src/shared/api/backend-client.ts` : `getServerEnv().BACKEND_API_URL` lu dans
    `backendRequest`, au moment de la requête (seul usage de `serverEnv` dans `src/`)
  - `src/instrumentation.ts` : `export async function register()` (voir décisions)
  - `src/shared/config/env.server.test.ts` : T1/T2 du socle réécrits sur
    `getServerEnv()` (variables posées par `vi.stubEnv`, module réimporté après
    `vi.resetModules()`), plus le test de mémorisation ; les tests de
    `parseServerEnv` peuvent être conservés
  - `src/instrumentation.test.ts` (`// @vitest-environment node`)
- **Critères de succès** :
  - [x] T1 (socle) passe : avec `BACKEND_API_URL=http://localhost:8080`,
        `getServerEnv().BACKEND_API_URL` vaut `http://localhost:8080`
  - [x] T2 (socle) passe : sans `BACKEND_API_URL`, puis avec une valeur qui n'est pas
        une URL, `getServerEnv()` lève une erreur dont le message contient
        `BACKEND_API_URL`
  - [x] un test de mémorisation passe : deux appels successifs de `getServerEnv()`
        renvoient le même objet (`toBe`), y compris quand `BACKEND_API_URL` a été
        changée entre les deux appels (le second ne revalide pas)
  - [x] un test passe : importer `@/shared/config/env.server` sans `BACKEND_API_URL`
        ne lève aucune erreur (pas de validation au chargement du module)
  - [x] test (a) : avec `NEXT_RUNTIME=nodejs` et sans `BACKEND_API_URL`,
        `register()` est rejetée avec un message contenant `BACKEND_API_URL` ; avec
        `NEXT_RUNTIME=nodejs` et `BACKEND_API_URL=http://localhost:8080`, `register()`
        est résolue
  - [x] un test passe : avec `NEXT_RUNTIME=edge` et sans `BACKEND_API_URL`,
        `register()` est résolue (aucune validation hors runtime Node)
  - [x] `src/shared/api/backend-client.test.ts` passe sans modification (T3 à T7 du
        socle, `BACKEND_API_URL` fournie par `test.env` de `vitest.config.ts`)
  - [x] test (b) : `ls -a` à la racine ne liste aucun fichier `.env` ni `.env.*` autre
        que `.env.example`, puis `env -u BACKEND_API_URL pnpm build` sort en 0 et liste
        la route `/[locale]/products`
  - [x] `harness gate arch --rule next-no-process-env` sort en 0 (`process.env` lu
        seulement dans `src/shared/config/`, y compris `NEXT_RUNTIME`)
  - [x] `harness gate arch --rule next-shared-knows-nothing` sort en 0
  - [x] `harness gate arch --rule next-no-public-backend-url` sort en 0
  - [x] `pnpm lint`, `pnpm lint:architecture`, `pnpm typecheck` et `pnpm test`
        sortent en 0 ; les tests des étapes 1 à 4 passent sans modification
- **Preuve finale (orchestrateur, hors étape)** : `harness verify` lancé sans
  `BACKEND_API_URL` dans l'environnement (par exemple `env -u BACKEND_API_URL harness verify`)
  est vert, `web:build` compris.
- **Durée estimée** : 30 min

## Couverture du plan de test de la spec

| Test | Étape |
| ---- | ----- |
| T1, T2, T3, T19 | 1 |
| T4 à T7, T18 | 2 |
| T8 à T15, T17, T20 | 3 |
| T16, T21, T22 | 4 |
| T22 (`pnpm build` sans `BACKEND_API_URL`) ; T1/T2 de `web-foundation` (US-003 : échec au démarrage nommant `BACKEND_API_URL`) | 5 |

Les Server Components asynchrones (`page.tsx`, accueil) sont couverts par leurs
queries (T5 à T7), par les composants synchrones qu'ils composent (T8 à T14) et par le
build (règle `testing`). Les parcours de bout en bout (rendu complet de
`/fr/products`, suivi du lien de l'accueil) sont exclus par la spec (E2E reportés).

## Risques

- `Link` de next-intl sous Vitest/jsdom : s'il exige un contexte de routeur Next.js
  absent, le signaler comme écart (ne pas contourner par une balise `<a>`).
- `useTranslations` dans un Server Component synchrone (next-intl 4) : vérifié au build
  de l'étape 4 ; les tests de composants passent par `NextIntlClientProvider`.
- Déplacement du point d'entrée next-intl vers `src/app/_i18n/request.ts` : un chemin
  erroné dans `next.config.ts` casse le build de l'étape 4 et toutes les traductions.
- Formatage monétaire dépendant de l'ICU de Node : assertions normalisées (U+00A0,
  U+202F → espace), comme `money.test.ts`.
- **Étape 5, `server-only` importé depuis `instrumentation.ts`** : si `pnpm build`
  refuse l'import dynamique de `env.server.ts` (`server-only`) depuis
  `src/instrumentation.ts`, s'arrêter et le signaler comme écart. Ne pas retirer
  `import "server-only"` de `env.server.ts`.
- **Étape 5, déplacement de l'échec** : le build ne détecte plus une variable absente.
  L'échec arrive au démarrage du serveur (`register()`), avant la première requête.
  Un environnement de déploiement sans `BACKEND_API_URL` est donc refusé au
  lancement, et non plus à la compilation.
- **Étape 5, mémorisation dans les tests** : l'état mémorisé survit entre les tests
  d'un même fichier ; chaque cas qui change l'environnement doit réimporter le module
  après `vi.resetModules()`, sinon les tests dépendent de leur ordre.
