# Plan d'exécution : catalog-product-detail

- **Statut** : COMPLETED
- **Taille** : S
- **Points d'arrêt** : aucun
  **Note** : l'humain approuve ce plan en tapant `/harness:ship docs/specs/catalog-product-detail.md --continue` ; il passe `COMPLETED` sur preuve en fin de cycle (toutes les cases cochées, `harness verify` vert).

- **Spec** : `docs/specs/catalog-product-detail.md` (Approved, v0.1.0, aucune révision)
- **Règles** : `.claude/rules/nextjs/` (features, feature-server, feature-client, model-schemas, app-routes, i18n, ui, testing, shared)
- **Contrat consommé** : `docs/api/backends/shop-api.openapi.json` (commit `27625d9`), opération `CatalogController_getProduct_v1` (`GET /v1/products/{id}`)
- **Révisions du plan** : aucune

## Questions à l'humain

1. **Délai d'expiration de T6.** T6 demande « une réponse après 6 secondes avec
   `timeoutMs` réduit » sur `getProductDetail`, mais la spec donne la signature
   `getProductDetail({ id, locale })` sans `timeoutMs`. Ajouter un champ optionnel
   `timeoutMs?: number` à `getProduct` (gateway) et à `getProductDetail` (query),
   transmis tel quel à `backendRequest` et jamais passé par la page (délai de 5 s
   hérité) ? **Réponse de l'humain : oui.**
2. **Clé de `cache()`.** `cache()` de React compare les arguments par identité : un
   objet `{ id, locale }` neuf à chaque appel ne serait jamais retrouvé, et la page
   et `generateMetadata` feraient deux appels. La spec veut des arguments chaînes
   comparés par valeur. Garder la signature publique `getProductDetail({ id, locale, timeoutMs? })`,
   qui délègue à une fonction interne `cache((id: string, locale: string, timeoutMs?: number) => …)`
   à arguments positionnels (primitifs) ? **Réponse de l'humain : oui.**
3. **Un seul `h1` dans chaque rendu.** La spec exige un seul `h1` mais ne dit pas où
   il se trouve hors du cas nominal. `ProductDetailView` porte le `h1` (nom du
   produit) ; `ProductNotFound` porte le `h1` (texte `catalog.productNotFound`) ;
   dans le cas d'erreur, la page rend un `h1` `catalog.productTitle` suivi de
   `ProductDetailError` (message dans un `<p>` sous `role="alert"`). D'accord ?
   **Réponse de l'humain : oui.**

## Constat de départ (code lu)

- Feature `src/features/catalog/` en place (spec `catalog-products-list`) :
  - `schemas/products.ts` : `productListResponseSchema` (item `id: z.string()`,
    `name` 1..200, `price.amount` `^\d+\.\d{2}$`, `price.currency` `z.enum(CURRENCIES)`),
    `productsSearchParamsSchema`.
  - `model/products.ts` : `CURRENCIES`, `Currency`, `ProductListItem`,
    `ProductListPage`, `productsSearchParams` ; `model/products.test.ts`.
  - `server/gateway.ts` (`listProducts`), `server/mappers.ts` (`toProductListPage`),
    `server/queries.ts` (`getProductListPage`), chacun `import "server-only"` ;
    tests `mappers.test.ts`, `queries.test.ts` (`// @vitest-environment node`,
    `setupServer()`, `server.listen({ onUnhandledFrame: "error" })`, `createRequestLog`).
  - `server.ts` (`server-only`) réexporte `productsSearchParamsSchema` et
    `getProductListPage` ; `index.ts` réexporte les composants, les types et
    `loadCatalogMessages`.
  - `__mocks__/handlers.ts` : fabriques sur `*/v1/products` (`productsHandler`,
    `productsErrorHandler(status, code, log?)` avec `message: "texte du backend"`,
    `invalidProductsHandler`, `slowProductsHandler`), `RequestLog`, `makeProducts`
    (ids `00000000-0000-4000-8000-<12 chiffres>`, noms `Produit N`).
  - `components/product-list.tsx` : `<span>{item.name}</span>` (pas de lien) ;
    `product-list.test.tsx` rend un produit d'id `"1"` en `en` et vérifie « Mug » et
    `€1,234.50` dans le `listitem`.
  - `components/product-list-error.tsx` : modèle de repli
    `t.has(\`errors.${code}\`) ? t(key) : t("errors.generic")` sous `role="alert"`.
  - `components/catalog-link.tsx` : modèle de lien `Link` de `@/shared/i18n/navigation`.
  - `messages/fr.json`, `messages/en.json` : corps du namespace `catalog` (clés
    `title`, `empty`, `filterLabel`, `allCurrencies`, `nextPage`, `firstPage`,
    `viewCatalog`).
- `src/shared/api/backend-client.ts` : `backendRequest(path, { schema, locale, timeoutMs? })`,
  `BackendError = { code, status }`, un `!response.ok` donne `{ code du corps ou BACKEND_ERROR, status }`,
  `fetch` avec `cache: "no-store"` et `signal: AbortSignal.timeout(timeoutMs)`.
- `src/shared/i18n/routing.ts` : pas de `pathnames`, donc `Link href` accepte une
  chaîne libre (`/products/<id>`).
- Route `src/app/[locale]/products/` : `page.tsx` (modèle : `Props` avec
  `params: Promise<…>`, `setRequestLocale`, `getTranslations`, `generateMetadata`
  avec `getTranslations({ locale, namespace: "catalog" })`), `loading.tsx` (Server
  Component, `role="status"`), `error.tsx` (`"use client"`).
  `src/app/[locale]/not-found.tsx` et `src/app/[locale]/layout.tsx` importent déjà
  `notFound` de `next/navigation` (autorisé : la règle ESLint
  `next-i18n-navigation` n'interdit que `redirect`, `useRouter`, `usePathname`).
- Versions installées : `next` 16.3.8, `react` 19.2.8, `next-intl` ^4.14.9,
  `zod` ^4.6.5 (`z.uuid()` disponible), `msw` ^3.0.2 (`onUnhandledFrame`),
  `vitest` ^5.0.3. `vitest.config.ts` : jsdom par défaut, alias `server-only`,
  `BACKEND_API_URL=http://backend.test`.
- **Documentation Next.js lue** :
  - `01-app/03-api-reference/04-functions/not-found.md` : `notFound()` lève
    (type `never`), à appeler dans le chemin de rendu ; un `try/catch` autour
    l'avale ; après le début du flux, la réponse reste en `200` (cas de
    `products/loading.tsx` hérité, accepté par la spec, Risques).
  - `01-app/03-api-reference/03-file-conventions/not-found.md` : `not-found.tsx`
    de segment, sans props, Server Component, rendu sous le `Suspense` de
    `loading` et l'error boundary du segment.
  - `01-app/03-api-reference/04-functions/generate-metadata.md` : `fetch` mémorisé
    entre `generateMetadata` et la page, « React `cache` can be used if `fetch` is
    unavailable » ; `notFound()` utilisable dans `generateMetadata` (non retenu :
    la spec veut un titre de repli) ; métadonnées streamées par défaut.
  - `01-app/03-api-reference/04-functions/fetch.md` (l. 90-94) : passer un
    `signal` d'`AbortController` désactive la mémorisation du `fetch`. Le `fetch`
    de `backendRequest` porte `AbortSignal.timeout(...)` : sans `cache()`, deux
    appels. Confirme le choix de la spec.
  - `react` 19.2.8, `cjs/react.development.js` : hors build `react-server`,
    `cache(fn)` renvoie une fonction qui appelle `fn` à chaque fois. Sous Vitest,
    la query appelle donc le backend à chaque appel (le partage d'appel n'est pas
    testable, Risques de la spec).
- `harness.config.json` : `build`, `lint`, `typecheck`, `lint:architecture`, `test` ;
  `paths.generated` vide. Ce repo ne publie pas d'API JSON : aucun critère
  `harness gate openapi`.
- Aucune dépendance à installer (spec, « Dépendances »).

## Décisions de conception prises par le plan

- **Schémas** (`schemas/products.ts`) : `productIdSchema = z.uuid()` ;
  `productDetailResponseSchema` = objet `{ id: z.string(), name, price }` réutilisant
  les mêmes contraintes que l'item de la liste (extraire un `productSchema` commun
  utilisé par les deux, sans changer le comportement de `productListResponseSchema`) ;
  type `ProductDetailResponse` par `z.infer`.
- **Modèle** (`model/products.ts`) : `ProductDetail = { id, name, amount, currency: Currency }` ;
  `productDetailTitle(product: ProductDetail | undefined, fallback: string): string`.
- **Gateway** : `getProduct({ id, locale, timeoutMs? })` →
  `backendRequest(\`/v1/products/${encodeURIComponent(id)}\`, { schema: productDetailResponseSchema, locale, timeoutMs })`.
- **Query** : voir question 2 ; mapper `toProductDetail(response)` dans
  `server/mappers.ts`. Aucun `notFound()` dans la query : elle renvoie le `Result`,
  la page décide (`error.status === 404` → `notFound()`).
- **Handlers MSW** (`__mocks__/handlers.ts`, chemin `*/v1/products/:id`, ajout sans
  modifier les fabriques existantes) : `productHandler(product?, log?)` (par défaut
  « Mug » `1234.50 EUR`, id `00000000-0000-4000-8000-000000000001`),
  `productErrorHandler(status, code, log?)` (corps `{ statusCode, code, message: "texte du backend", details: [...] }`),
  `invalidProductHandler(log?)` (prix `"12.5"`), `slowProductHandler(delayMs, log?)`.
- **Composants** (Server Components synchrones, aucun `"use client"`, un par fichier) :
  - `ProductDetailView({ product })` : `h1` avec le nom, prix par
    `formatMoney(amount, currency, useLocale())`, `BackToCatalogLink`.
  - `BackToCatalogLink()` : `Link href="/products"` de `@/shared/i18n/navigation`,
    texte `catalog.backToCatalog`.
  - `ProductNotFound()` : `h1` `catalog.productNotFound` + `BackToCatalogLink`.
  - `ProductDetailError({ code })` : `role="alert"`, repli `errors.<code>` /
    `errors.generic` comme `ProductListError`, + `BackToCatalogLink`.
  - `ProductList` : le nom devient `Link href={\`/products/${encodeURIComponent(item.id)}\`}`.
- **Route** `src/app/[locale]/products/[id]/` :
  - `page.tsx` : `params: Promise<{ locale: string; id: string }>` ;
    `setRequestLocale(locale)` ; `productIdSchema.safeParse(id)` en échec →
    `notFound()` (aucun appel) ; `getProductDetail({ id, locale })` ;
    `error.status === 404` → `notFound()` ; autre erreur → `h1`
    `catalog.productTitle` + `ProductDetailError` ; succès → `ProductDetailView`.
    Pas de `try/catch` autour de `notFound()`.
  - `generateMetadata` : identifiant invalide → `{ title: t("productTitle") }` sans
    appel ; sinon `getProductDetail` puis
    `{ title: productDetailTitle(result.ok ? result.value : undefined, t("productTitle")) }`.
  - `not-found.tsx` : `<main>` qui compose `ProductNotFound`.
  - Pas de `loading.tsx` ni `error.tsx` propres : hérités de `products/`.

## Étapes

### Étape 1 — Schémas, modèle, accès serveur et handlers MSW

- **Fichiers** :
  - `src/features/catalog/schemas/products.ts` (+ `schemas/products.test.ts`,
    tests existants conservés)
  - `src/features/catalog/model/products.ts` (+ `model/products.test.ts`)
  - `src/features/catalog/server/gateway.ts` (`getProduct`)
  - `src/features/catalog/server/mappers.ts` (`toProductDetail`, + `mappers.test.ts`)
  - `src/features/catalog/server/queries.ts` (`getProductDetail` par `cache()`, voir
    décisions et question 2)
  - `src/features/catalog/server/product-detail.test.ts` ou ajout dans
    `server/queries.test.ts` (`// @vitest-environment node`, `onUnhandledFrame: "error"`)
  - `src/features/catalog/server.ts` (réexporte aussi `getProductDetail` et `productIdSchema`)
  - `src/features/catalog/__mocks__/handlers.ts` (handlers `*/v1/products/:id`)
- **Critères de succès** :
  - [x] T1 passe : `productIdSchema` accepte `00000000-0000-4000-8000-000000000001`
        et refuse `pas-un-uuid`, `""`, `../products`, `["a","b"]`
  - [x] T2 passe : schéma de réponse détail : corps conforme accepté ; prix `"12.5"`
        refusé ; corps sans `name` refusé
  - [x] T3 passe : `toProductDetail({id,name:"Mug",price:{amount:"1234.50",currency:"EUR"}})`
        renvoie `{id,name:"Mug",amount:"1234.50",currency:"EUR"}`
  - [x] T19 passe : `productDetailTitle(mug, "Produit")` vaut `"Mug"` ;
        `productDetailTitle(undefined, "Produit")` vaut `"Produit"`
  - [x] T4 passe : `getProductDetail({id:"00000000-0000-4000-8000-000000000001",locale:"fr"})`
        → succès avec le produit ; MSW reçoit exactement un appel, `pathname`
        `/v1/products/00000000-0000-4000-8000-000000000001`, `Accept-Language: fr`
  - [x] T5 passe : réponse 404 `{"code":"PRODUCT_NOT_FOUND","message":"texte du backend"}`
        → `{ ok: false, error: { code: "PRODUCT_NOT_FOUND", status: 404 } }`, promesse résolue
  - [x] T6 passe : 500 `INTERNAL_ERROR` → `INTERNAL_ERROR`/500 ; 400
        `VALIDATION_FAILED` → `VALIDATION_FAILED`/400 ; corps non conforme →
        `INVALID_BACKEND_RESPONSE`/502 ; réponse retardée au-delà d'un `timeoutMs`
        réduit → `BACKEND_TIMEOUT`/504 ; promesse résolue dans les quatre cas
  - [x] un test passe : `getProductDetail` sur un chemin sans handler n'aboutit pas à
        un succès (`onUnhandledFrame: "error"` actif dans le fichier de test)
  - [x] les tests existants de `schemas/`, `model/`, `mappers.test.ts` et
        `queries.test.ts` (T1 à T7 de la liste) passent sans modification de leurs attendus
  - [x] `harness gate arch --rule next-model-pure`,
        `harness gate arch --rule next-no-fetch-outside-api`,
        `harness gate arch --rule next-no-amount-arithmetic` et
        `harness gate arch --rule next-no-cross-feature` sortent en 0
  - [x] `pnpm typecheck` et `pnpm test` sortent en 0
- **Durée estimée** : 35 min

### Étape 2 — Traductions et composants (fiche, introuvable, erreur, liens)

Lire avant d'écrire : les types de `next-intl` installés pour `useTranslations`,
`useLocale` et `t.has` dans un Server Component synchrone (déjà utilisés par
`ProductListError`).

- **Fichiers** :
  - `src/features/catalog/messages/fr.json`, `src/features/catalog/messages/en.json`
    (clés `productTitle`, `backToCatalog`, `productNotFound`, mêmes clés dans les deux)
  - `src/features/catalog/components/back-to-catalog-link.tsx`,
    `product-detail-view.tsx`, `product-not-found.tsx`, `product-detail-error.tsx`,
    un `*.test.tsx` par composant (`NextIntlClientProvider` +
    `{ ...messagesRacine, catalog: messagesFeature }` depuis les vrais fichiers)
  - `src/features/catalog/components/product-list.tsx` et `product-list.test.tsx`
    (ids UUID distincts, assertions du lien ajoutées, assertion nom + prix dans le
    `listitem` conservée)
  - `src/features/catalog/index.ts` (réexporte les quatre composants et le type `ProductDetail`)
- **Critères de succès** :
  - [x] T7 passe : `ProductDetailView` en `en` avec « Mug » `1234.50 EUR` → un seul
        `heading` de niveau 1, contenant « Mug » ; texte `€1,234.50` présent (U+00A0
        et U+202F normalisés en espace)
  - [x] T8 passe : `ProductDetailView` en `fr` → le prix affiché égale
        `formatMoney("1234.50","EUR","fr")` (espaces normalisés des deux côtés)
  - [x] T9 passe : `ProductList` en `fr` avec deux produits d'ids
        `00000000-0000-4000-8000-000000000000` et `…000000000001` → chaque nom est
        un `link` dont le `href` est `/fr/products/<id>` de son produit ; les deux
        `href` diffèrent ; le test existant (nom et `€1,234.50` dans le `listitem`) passe
  - [x] T10 passe : `BackToCatalogLink` en `fr` → `link` nommé par
        `catalog.backToCatalog` de `src/features/catalog/messages/fr.json`, `href` `/fr/products`
  - [x] T11 passe : `ProductNotFound` en `fr` → texte `catalog.productNotFound` de
        `src/features/catalog/messages/fr.json` dans un `heading` de niveau 1 ; lien
        « Retour au catalogue » vers `/fr/products`
  - [x] T12 passe : `ProductDetailError` `{code:"BACKEND_TIMEOUT"}` → `role="alert"`
        contenant `errors.BACKEND_TIMEOUT` de `messages/fr.json` ;
        `{code:"UNKNOWN_CODE"}` → `errors.generic` ; lien « Retour au catalogue » vers
        `/fr/products` dans les deux cas
  - [x] T13 : `pnpm lint:architecture` sort en 0 (parité des traductions)
  - [x] `harness gate arch --rule next-index-client-safe`,
        `harness gate arch --rule next-i18n-navigation`,
        `harness gate arch --rule next-no-dangerous-html` et
        `harness gate arch --rule next-no-amount-arithmetic` sortent en 0
  - [x] `pnpm lint` sort en 0 (aucun texte d'interface en dur)
  - [x] `pnpm typecheck` et `pnpm test` sortent en 0 ; les autres tests de composants
        de la feature, `src/app/[locale]/error.test.tsx` et ceux de l'étape 1 passent
        sans modification
- **Durée estimée** : 40 min

### Étape 3 — Route `/[locale]/products/[id]`, page « introuvable » et titre

Lire avant d'écrire : `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md`,
`03-file-conventions/not-found.md`, `04-functions/generate-metadata.md` (sections
mémorisation et streaming), `03-file-conventions/page.md` (`params` asynchrones).

- **Fichiers** : `src/app/[locale]/products/[id]/page.tsx` (page + `generateMetadata`,
  voir décisions), `src/app/[locale]/products/[id]/not-found.tsx`
- **Critères de succès** :
  - [x] `pnpm build` sort en 0 et liste la route `/[locale]/products/[id]` comme dynamique
  - [x] T14 : `harness gate arch --rule next-no-cross-feature` et
        `harness gate arch --rule next-app-feature-public-api-only` sortent en 0
  - [x] T15 : `harness gate arch --rule next-index-client-safe`,
        `harness gate arch --rule next-model-pure` et
        `harness gate arch --rule next-no-fetch-outside-api` sortent en 0
  - [x] T16 : `harness gate arch --rule next-no-amount-arithmetic` et
        `harness gate arch --rule next-i18n-navigation` sortent en 0
  - [x] T17 : `harness gate arch --rule next-no-dangerous-html` et
        `harness gate arch --rule next-no-use-client-on-routes` sortent en 0
  - [x] `harness gate arch --rule next-no-process-env`,
        `harness gate arch --rule next-no-public-backend-url` et
        `harness gate arch --rule next-shared-knows-nothing` sortent en 0
  - [x] NFR poids client : `grep -rlE "^['\"]use client['\"]" src/features/catalog 'src/app/[locale]/products'`
        liste exactement `src/app/[locale]/products/error.tsx`, et aucun autre fichier
  - [x] T18 : `pnpm lint`, `pnpm lint:architecture` et `pnpm typecheck` sortent en 0
  - [x] `pnpm test` sort en 0 ; tous les tests des étapes 1 et 2 et du socle passent
        sans modification
- **Durée estimée** : 25 min

## Couverture du plan de test de la spec

| Test | Étape |
| ---- | ----- |
| T1 à T6, T19 | 1 |
| T7 à T13 | 2 |
| T14 à T18 | 3 |

`page.tsx`, `generateMetadata` et `not-found.tsx` (asynchrones ou composés par Next.js)
sont couverts par la query (T4 à T6), par les composants synchrones qu'ils composent
(T7 à T12) et par le build (règle `testing`). Ne sont **pas** prouvés par un test
automatique, conformément à la spec (Risques, E2E exclus) : l'appel unique partagé
par `cache()` entre la page et `generateMetadata` (US-001), le titre du document
(US-001, US-003 : seule la fonction `productDetailTitle` est testée, T19), l'absence
d'appel au backend sur `/fr/products/pas-un-uuid` au niveau de la page (US-003), et le
branchement 404 → `notFound()`. Ils relèvent de la vérification après déploiement
décrite dans la spec.

## Risques

- **`Link` à `href` dynamique** : `routing` n'a pas de `pathnames`, donc
  `/products/<id>` est accepté. Si le typecheck le refuse, s'arrêter et le signaler
  comme écart (ne pas contourner par `<a>` ni par `next/link`).
- **`cache()` sous Vitest** : passthrough hors build `react-server` (constaté dans
  `react` 19.2.8) ; T4 « exactement un appel » ne dépend donc pas de la mémorisation.
  Si un test appelle deux fois `getProductDetail`, il attend deux appels.
- **`notFound()` avalé** : ne jamais l'entourer d'un `try/catch` dans la page.
- **Code HTTP de la page « introuvable »** : `200` probable (flux ouvert par
  `products/loading.tsx`) ; accepté par la spec, non vérifié.
- **Extraction d'un `productSchema` commun** : le T2 existant de
  `productListResponseSchema` doit passer sans modification ; sinon garder deux
  schémas distincts.
- **Formatage monétaire dépendant de l'ICU de Node** : assertions normalisées
  (U+00A0, U+202F → espace), comme `product-list.test.tsx`.
