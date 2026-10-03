# Plan d'exécution : web-foundation

- **Statut** : COMPLETED
- **Taille** : M
- **Points d'arrêt** : après l'étape 1 (gestes humains impossibles au generator : suppression des fichiers de démonstration et ajout de la commande `test` dans `harness.config.json`, voir « Point d'arrêt H1 »)
  **Note** : l'humain approuve ce plan en tapant `/harness:ship docs/specs/web-foundation.md --continue` ; il passe `COMPLETED` sur preuve en fin de cycle (toutes les cases cochées, `harness verify` vert).

- **Spec** : `docs/specs/web-foundation.md` (Approved, v0.1.0)
- **Règles** : `.claude/rules/nextjs/` (shared, general, security, i18n, app-routes, testing, verification)

## Constat de départ (code lu)

- `package.json` : toutes les dépendances de la spec sont **déjà déclarées et installées**
  (`next` 16.3.8, `next-intl` 4.14.9, `zod` 4, `server-only`, `vitest` 5.0.3, `msw` 3.0.2,
  `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`).
  Aucune installation de paquet n'est nécessaire. Pas de script `test`.
- `src/app/` : `layout.tsx` (démo, polices Geist, `lang="en"`), `page.tsx` (démo,
  `next/image` sur `/next.svg`, textes en dur), `globals.css`, `favicon.ico`.
  `public/` : `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` (démo).
- `next.config.ts` vide ; `tsconfig.json` : alias `@/*` → `./src/*`.
- `eslint.architecture.mjs` : `react/jsx-no-literals`, `process.env` interdit hors
  `src/shared/config/**`, `next/link` et `redirect/useRouter/usePathname` de
  `next/navigation` interdits hors `src/shared/i18n/**`, `no-console`.
- `scripts/i18n-check.mjs` (lancé par `pnpm lint:architecture`) compare les clés de
  `messages/*.json` ; `.dependency-cruiser.cjs` classe `src/shared/config/env.server` et
  `src/shared/api/backend-client` comme code serveur.
- `.gitignore` contient `.env*` : **`.env.example` serait ignoré** ; il faut une exception
  `!.env.example` (étape 2).
- `harness.config.json` : pas de commande `test` (CLAUDE.md : « test : à venir (socle
  `web-foundation`) »). Le generator ne peut pas la modifier (règle 5) → point d'arrêt H1.
- Next.js 16 : le fichier de routage est **`src/proxy.ts`** (et non `middleware.ts`), voir
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` et
  `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.
- Vitest : `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`.
- Le paquet `server-only` lève une erreur hors condition `react-server` : sous Vitest, il
  doit être aliasé vers le **chemin absolu** de `node_modules/server-only/empty.js`
  (dans `vitest.config.ts`, pas dans le code) : le champ `exports` du paquet n'expose que
  `.`, donc le spécificateur `server-only/empty.js` est refusé par la résolution (constaté à
  l'étape 2, révision du plan).

## Décisions de conception prises par le plan

- **Configuration testable** : `env.server.ts` exporte une fonction pure
  `parseServerEnv(source: Record<string, string | undefined>)` (testée par T1/T2) et
  l'objet `serverEnv = parseServerEnv(process.env)` évalué au chargement du module
  (US-003 : échec au démarrage). Sous Vitest, `BACKEND_API_URL` est fournie par
  `test.env` de `vitest.config.ts` (ex. `http://backend.test`), jamais par `process.env`
  dans un fichier de `src/`.
- **`backendRequest`** : signature indicative
  `backendRequest<T>(path, { schema, locale, method?, body?, requestId?, timeoutMs? }) : Promise<Result<T, BackendError>>`.
  `locale` est passée par l'appelant (`Accept-Language`), `X-Request-Id` repris de
  `requestId` ou généré (`crypto.randomUUID()`), `timeoutMs` par défaut = constante
  `BACKEND_TIMEOUT_MS = 5000` définie dans `backend-client.ts` (surcharge réservée aux
  tests pour T5). `BackendError = { code: string; status: number }` ; jamais d'exception
  levée vers l'appelant.
- **Root layout** : `src/app/layout.tsx` est réduit à un layout de passage (`return children`,
  modèle next-intl quand `app/` contient des fichiers hors `[locale]`) ; `<html lang>` est
  rendu par `src/app/[locale]/layout.tsx`. Pas de suppression de ce fichier.
- **`global-error.tsx`** : hors contexte next-intl ; son texte provient des catalogues
  (import de `messages/fr.json`, clé `errors.*`), jamais d'une chaîne JSX en dur.
- **Contrat OpenAPI** : `GET /api/health` est une sonde interne du serveur Next.js, pas une
  API backend ; ce repo n'a pas de `docs/api/openapi.json` publié et aucun invariant
  `openapi` n'est listé pour la stack. Aucun critère `harness gate openapi` dans ce plan.

## Étapes

### Étape 1 — Socle de tests Vitest et utilitaires `shared/lib`

- **Fichiers** : `vitest.config.ts` (racine), `vitest.setup.ts` (racine),
  `package.json` (script `"test": "vitest run"`), `src/shared/lib/result.ts`,
  `src/shared/lib/money.ts`, `src/shared/lib/money.test.ts`, `src/shared/lib/index.ts`
  (optionnel, réexport)
- **Contenu** :
  - `vitest.config.ts` : `@vitejs/plugin-react`, environnement `jsdom` par défaut (les tests
    serveur choisissent `node` par l'annotation `// @vitest-environment node`), alias `@` →
    `src`, alias `server-only` → chemin absolu de `node_modules/server-only/empty.js`, `test.env.BACKEND_API_URL`,
    `setupFiles: ["./vitest.setup.ts"]` qui importe `@testing-library/jest-dom/vitest`.
    Imports explicites depuis `vitest` (pas de globals) pour que `pnpm typecheck` passe.
  - `Result<T, E>` (succès / erreur typée) avec constructeurs `ok()` / `err()`.
  - `formatMoney(amount: string, currency: string, locale: string)` : aucune conversion en
    `number` (`Intl.NumberFormat` sur la chaîne, pas de `Number()`, `parseFloat`, `toFixed`).
- **Critères de succès** :
  - [x] T8 passe : `formatMoney("1234.50","EUR","fr")` → `1 234,50 €` et
        `formatMoney("1234.50","EUR","en")` → `€1,234.50` (espaces insécables normalisés dans
        l'assertion)
  - [x] `pnpm test` sort en 0
  - [x] `pnpm typecheck` sort en 0
  - [x] `harness gate arch --rule next-no-amount-arithmetic` sort en 0
- **Durée estimée** : 25 min

### Point d'arrêt H1 — gestes humains (après l'étape 1)

Le generator ne peut ni supprimer de fichier ni modifier `harness.config.json`. L'humain :

1. supprime la démonstration de create-next-app :
   `git rm src/app/page.tsx public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg`
2. ajoute la commande de test à la stack `web` de `harness.config.json` :
   `"test": "pnpm test"` dans `project.stacks[0].commands`
3. relance avec `/harness:ship docs/specs/web-foundation.md --continue`

- [x] Fichiers de démonstration supprimés et commande `test` déclarée dans `harness.config.json`

### Étape 2 — Configuration serveur validée (`shared/config`)

- **Fichiers** : `src/shared/config/env.server.ts`, `src/shared/config/env.server.test.ts`,
  `.env.example`, `.gitignore` (exception `!.env.example`), `vitest.config.ts` (correction)
- **Correction préalable (révision)** : dans `vitest.config.ts`, remplacer l'alias
  `"server-only": "server-only/empty.js"` par
  `"server-only": path.resolve(import.meta.dirname, "node_modules/server-only/empty.js")`.
  Les fichiers de l'étape déjà écrits avant la révision (`env.server.ts`, son test,
  `.env.example`, `.gitignore`) sont conservés et relus contre les critères.
- **Contenu** : `import "server-only"` en tête ; schéma Zod (`BACKEND_API_URL` URL
  obligatoire, `NODE_ENV` énuméré) ; `parseServerEnv` lève une erreur dont le message nomme
  la variable en cause ; `.env.example` avec une valeur d'exemple non réelle
  (`BACKEND_API_URL=http://localhost:8080`).
- **Critères de succès** :
  - [x] T1 passe : une source avec `BACKEND_API_URL` valide renvoie l'objet typé
  - [x] T2 passe : une source sans `BACKEND_API_URL`, puis une valeur qui n'est pas une URL,
        lèvent une erreur dont le message contient `BACKEND_API_URL`
  - [x] `.env.example` n'est pas ignoré par git : `git status --porcelain` le liste comme
        fichier non suivi (`?? .env.example`)
  - [x] T11 : `harness gate arch --rule next-no-process-env` sort en 0
  - [x] T14 : `harness gate arch --rule next-no-public-backend-url` sort en 0
  - [x] Les tests de l'étape 1 passent toujours après la correction de l'alias
        (`pnpm test` sort en 0)
- **Durée estimée** : 20 min

### Étape 3 — Point d'appel unique au backend (`shared/api/backend-client.ts`)

- **Fichiers** : `src/shared/api/backend-client.ts`,
  `src/shared/api/backend-client.test.ts` (environnement `node`, `setupServer` de
  `msw/node`, handlers sur l'URL de `test.env`)
- **Contenu** : `import "server-only"` ; seul `fetch` vers `serverEnv.BACKEND_API_URL` ;
  `cache: "no-store"` ; `AbortSignal.timeout(timeoutMs)` ; en-têtes `Accept-Language` et
  `X-Request-Id` ; validation Zod du corps ; correspondance des erreurs :
  corps non conforme → `INVALID_BACKEND_RESPONSE`/502, expiration → `BACKEND_TIMEOUT`/504,
  réseau injoignable → `BACKEND_UNAVAILABLE`/503, réponse d'erreur → `code` du corps s'il
  existe sinon `BACKEND_ERROR`, avec le statut du backend ; le `message` du backend n'est
  jamais repris dans `BackendError`.
- **Correction préalable (révision 2)** : dans `backend-client.test.ts`, remplacer
  `server.listen({ onUnhandledRequest: "error" })` par
  `server.listen({ onUnhandledFrame: "error" })`. msw 3.0.2 a renommé l'option :
  l'ancienne était ignorée à l'exécution (aucune requête non prévue ne faisait échouer
  les tests) et fait échouer `pnpm typecheck` (TS2353), donc `pnpm build` (constaté à
  l'étape 4).
- **Critères de succès** :
  - [x] T3 passe : 200 conforme → succès avec les données validées
  - [x] T4 passe : 200 non conforme → erreur `INVALID_BACKEND_RESPONSE`, statut 502
  - [x] T5 passe : réponse plus lente que le délai → erreur `BACKEND_TIMEOUT`, statut 504
  - [x] T6 passe : 404 `{"code":"PRODUCT_NOT_FOUND"}` → erreur `PRODUCT_NOT_FOUND`, statut
        404, la promesse est résolue (aucune exception)
  - [x] T7 passe : la requête reçue par MSW porte `Accept-Language` (= locale passée) et un
        `X-Request-Id` non vide
  - [x] un test supplémentaire passe : erreur réseau MSW (`HttpResponse.error()`) →
        `BACKEND_UNAVAILABLE`, statut 503
  - [x] T12 : `harness gate arch --rule next-no-fetch-outside-api` sort en 0
  - [x] Aucun test n'appelle un vrai serveur : MSW configuré avec
        `onUnhandledFrame: "error"` (nom de l'option dans msw 3)
  - [x] `pnpm typecheck` ne signale aucune erreur dans `src/shared/api/`
- **Durée estimée** : 35 min

### Étape 4 — Internationalisation et routage par langue

Lire avant d'écrire : `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`,
`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, et la
documentation App Router de next-intl 4 (`node_modules/next-intl/`).

- **Fichiers** :
  - `src/shared/i18n/routing.ts` (`locales: ["fr","en"]`, `defaultLocale: "fr"`),
    `src/shared/i18n/navigation.ts` (`Link`, `redirect`, `useRouter`, `usePathname` via
    `createNavigation`), `src/shared/i18n/request.ts` (`getRequestConfig`, chargement de
    `messages/<locale>.json`, repli sur la langue par défaut)
  - `messages/fr.json`, `messages/en.json` (espaces `common` et `errors`, mêmes clés)
  - `src/proxy.ts` (middleware next-intl, matcher qui exclut `api`, `_next` et fichiers
    statiques)
  - `next.config.ts` (plugin `createNextIntlPlugin("./src/shared/i18n/request.ts")`)
  - `src/app/layout.tsx` (réduit à un layout de passage, voir décisions)
  - `src/app/[locale]/layout.tsx` (`<html lang={locale}>`, `notFound()` pour une langue
    inconnue, `setRequestLocale`, `generateStaticParams`, `NextIntlClientProvider`,
    `globals.css` ; polices Geist retirées, voir révision 2)
  - `src/app/globals.css` (révision 2 : retrait des références `--font-geist-sans` et
    `--font-geist-mono`, les polices n'étant plus chargées par le layout)
  - `vitest.config.ts` (`server.deps.inline: ["next-intl"]`, repli prévu aux Risques)
  - `src/app/[locale]/page.tsx` (accueil traduit, un seul `h1`), `loading.tsx`
    (`"use client"` : en composant serveur il rend `/[locale]` dynamique et `/fr`, `/en`
    ne sont plus générés),
    `error.tsx` (`"use client"`, texte `errors.*`), `not-found.tsx`
  - `src/app/global-error.tsx` (`"use client"`, `<html>`/`<body>`, texte issu des catalogues)
  - `src/app/[locale]/error.test.tsx` (Testing Library + `NextIntlClientProvider` avec les
    vrais messages)
  - `src/shared/i18n/routing.test.ts`
  - `src/proxy.test.ts` (environnement `node` ; appelle l'export par défaut de `proxy.ts`
    avec un `NextRequest` construit à la main, sans cookie de langue ni `Accept-Language`
    pour que le résultat ne dépende que du routage)
- **Critères de succès** :
  - [x] Un test passe : `routing` déclare exactement `fr` et `en`, langue par défaut `fr`
  - [x] Un test du proxy passe : une requête sur `/` reçoit une redirection (statut 3xx)
        dont l'en-tête `Location` a pour chemin `/fr`
  - [x] Un test du proxy passe : une requête sur `/en` n'est pas redirigée (statut hors
        3xx, aucun en-tête `Location`)
  - [x] Un test passe : `error.tsx` rendu avec `messages/fr.json` affiche le texte de la clé
        d'erreur générique de `fr.json`, et avec `messages/en.json` celui de `en.json`
  - [x] `pnpm build` sort en 0 (routes `/[locale]` générées pour `fr` et `en`, `proxy.ts`
        reconnu)
  - [x] T10 : `pnpm lint:architecture` sort en 0 (parité des clés, dependency-cruiser)
  - [x] T15 : `pnpm lint` sort en 0 (aucun texte d'interface en dur, démonstration absente)
  - [x] T13 : `harness gate arch --rule next-i18n-navigation` sort en 0
  - [x] `harness gate arch --rule next-no-use-client-on-routes` sort en 0
  - [x] `harness gate arch --rule next-use-next-image` sort en 0
  - [x] `src/app/globals.css` ne contient plus `--font-geist`
        (`grep -c -- --font-geist src/app/globals.css` affiche 0)
  - [x] les tests des étapes 1 à 3 passent sans modification
- **Durée estimée** : 50 min

### Étape 5 — Sonde de vie `GET /api/health` et documentation des commandes

- **Fichiers** : `src/app/api/health/route.ts`, `src/app/api/health/route.test.ts`
  (environnement `node`), `CLAUDE.md` (section « Commandes canoniques » : `test : pnpm test`
  à la place de « à venir »)
- **Contenu** : `GET` renvoie `Response.json({ status: "ok" })` ; aucun import de
  `shared/api` ni de `shared/config`.
- **Critères de succès** :
  - [x] T9 passe : `GET()` appelé sans backend (aucun handler MSW) renvoie `200` et
        `{"status":"ok"}`
  - [x] `pnpm build` sort en 0 et liste la route `/api/health`
  - [x] `harness gate arch --rule next-no-fetch-outside-api` et
        `harness gate arch --rule next-no-process-env` sortent en 0
  - [x] `pnpm test` sort en 0 (T1 à T9 et tests ajoutés)
- **Durée estimée** : 15 min

## Couverture du plan de test de la spec

| Test | Étape |
| ---- | ----- |
| T8 | 1 |
| T1, T2, T11, T14 | 2 |
| T3 à T7, T12 | 3 |
| T10, T13, T15 | 4 |
| T9 | 5 |

**US-001 (rendu de `/fr`, `/en`, redirection de `/`)** : la spec ne prévoit pas de test
automatisé (Server Components asynchrones, E2E exclus). Preuve dans ce plan : build qui
génère `/fr` et `/en`, tests de `routing` et de `error.tsx` sur les vrais catalogues, et
test du proxy (étape 4, ajouté à la relecture du plan) : `/` redirigé vers `/fr`, `/en`
non redirigé. Seul `<html lang>` reste à constater à la main (`pnpm dev`) lors de la
revue, ou en E2E dans une spec ultérieure.

## Risques

- next-intl sous Vitest (ESM) : si l'import échoue, l'inliner via `server.deps.inline`
  dans `vitest.config.ts`.
- `formatMoney` dépend de l'ICU de Node : assertions sur valeur normalisée (U+00A0,
  U+202F → espace).
- `next/font/google` télécharge les polices au build : si le build n'a pas de réseau,
  retirer les polices Geist du layout (aucun impact fonctionnel).
