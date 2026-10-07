# Spec : catalog-products-list

- **Statut** : Implemented
- **Auteur** : Claude (à relire par l'équipe)
- **Version** : 0.2.0
- **Liée à** : `docs/specs/web-foundation.md` (socle : `backendRequest`, `Result`, `formatMoney`, i18n) ; règles `.claude/rules/nextjs/` (features, feature-server, feature-client, app-routes, model-schemas, i18n, ui, testing) ; contrat `docs/api/backends/shop-api.openapi.json` (commit `27625d9`), opération `CatalogController_listProducts_v1`
- **Révisions** :
  - 1 — 2026-10-05 — réponses aux questions du plan : chargement des messages de la feature composé dans `app/` (invariant `next-shared-knows-nothing`) ; `products/error.tsx` en `"use client"` (imposé par Next.js) ; composant `CatalogLink` pour tester le lien de l'accueil ; clés `errors.BACKEND_TIMEOUT` et `errors.BACKEND_UNAVAILABLE`

> **Choix à relire avant d'approuver.** Ils découlent du contrat de shop-api
> et des règles de la stack ; modifiez-les ici si besoin.
>
> | Choix                         | Valeur proposée                                                                                                                                             |
> | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | Nom de la feature             | `catalog` (`src/features/catalog/`, namespace de traduction `catalog`)                                                                                     |
> | URL de la page                | `/[locale]/products` (`/fr/products`, `/en/products`)                                                                                                       |
> | Taille de page                | 20 produits (`limit=20`, valeur par défaut du backend)                                                                                                      |
> | Sens du filtre `currency`     | Le backend renvoie uniquement les produits dont `price.currency` (devise stockée du prix) vaut la devise demandée, sans conversion ; confirmé par la spec `catalog-currency-filter` de shop-api |
> | Pagination                    | Par curseur, comme le backend : lien « Page suivante » et lien « Première page » ; pas de « Page précédente » ni de numéros de page (le curseur ne le permet pas) |
> | Contrôle du filtre            | Liens de navigation (« Toutes les devises », « EUR », « USD », « GBP »), rendus côté serveur : aucun JavaScript client, aucune nouvelle dépendance          |
> | Paramètre d'URL invalide      | Ignoré : la page s'affiche comme si le paramètre était absent                                                                                               |

## Contexte

Le socle `web-foundation` est en place mais l'application n'affiche encore
aucune donnée métier. shop-api expose `GET /v1/products`, une liste de
produits paginée par curseur et filtrable par devise. Cette feature rend
cette liste consultable par un visiteur, dans sa langue, avec des prix
formatés selon sa locale.

## Périmètre

**Inclus** :

- Feature `src/features/catalog/` :
  - `schemas/products.ts` : schéma Zod écrit à la main de la réponse de `GET /v1/products`, limité aux champs `items[].id`, `items[].name`, `items[].price.amount`, `items[].price.currency`, `nextCursor` ; schéma Zod des paramètres d'URL de la page (`currency` : `EUR` | `USD` | `GBP`, optionnel ; `cursor` : 1 à 200 caractères `[A-Za-z0-9_-]`, optionnel)
  - `model/` (TypeScript pur) : types de vue `ProductListItem` (`id`, `name`, `amount`, `currency`) et `ProductListPage` (`items`, `nextCursor`) ; constante `CURRENCIES = ["EUR", "USD", "GBP"]` ; fonction pure `productsSearchParams({ currency, cursor })` qui renvoie les paramètres d'URL de la page sans clé vide
  - `server/gateway.ts` (`server-only`) : `listProducts({ currency, cursor, locale })` au-dessus de `backendRequest`, appelle `/v1/products?limit=20[&currency=…][&cursor=…]` (paramètres encodés par `URLSearchParams`), retourne `Result`
  - `server/mappers.ts` : réponse backend → `ProductListPage`
  - `server/queries.ts` : `getProductListPage({ currency, cursor, locale })` pour le rendu, retourne `Result<ProductListPage, BackendError>`
  - `server.ts` (`server-only`) : réexporte `getProductListPage` ; `index.ts` (client-safe) : réexporte les composants, les types de vue et `loadCatalogMessages(locale)` (import dynamique de `./messages/<locale>.json`, interne à la feature)
  - `components/` (Server Components synchrones, aucun `"use client"`) : `ProductList` (liste `<ul>` : nom et prix formaté par `formatMoney`), `CurrencyFilter` (`<nav>` de liens, lien actif marqué `aria-current="page"`), `ProductPagination` (liens « Page suivante » et « Première page »), `ProductListEmpty`, `ProductListError`, `CatalogLink` (lien traduit `catalog.viewCatalog` vers `/products` par `Link` de `shared/i18n/navigation`)
  - `messages/fr.json` et `messages/en.json` : namespace `catalog`, mêmes clés dans les deux langues
  - `__mocks__/handlers.ts` : handlers MSW de `GET /v1/products` (liste, page suivante, filtre, vide, erreurs)
- Chargement des messages de la feature, sans que `shared/` connaisse une feature (invariant `next-shared-knows-nothing`) :
  - `src/shared/i18n/request.ts` devient une fabrique générique `createRequestConfig(loadFeatureMessages: (locale) => Promise<Record<string, unknown>>)` qui fusionne `messages/<locale>.json` et les messages fournis, en conservant le repli sur la locale par défaut ; aucun import de feature
  - `src/app/_i18n/request.ts` (dossier privé, non routable) : point d'entrée next-intl, compose `createRequestConfig(async (locale) => ({ catalog: await loadCatalogMessages(locale) }))`
  - `next.config.ts` : le plugin next-intl pointe vers `./src/app/_i18n/request.ts`
- `messages/fr.json` et `messages/en.json` : ajout de `errors.BACKEND_TIMEOUT` et `errors.BACKEND_UNAVAILABLE`
- Route `src/app/[locale]/products/` : `page.tsx` (parse `searchParams` par le schéma Zod, appelle `getProductListPage`, compose les composants, un seul `h1`), `loading.tsx`, `error.tsx` (`"use client"`, imposé par Next.js pour un `error.tsx` ; composant feuille sur le modèle de `src/app/[locale]/error.tsx` ; ne sert qu'aux exceptions inattendues, les erreurs du backend étant rendues dans la page)
- Accueil `src/app/[locale]/page.tsx` : compose `CatalogLink` (« Voir le catalogue », vers `/[locale]/products`)
- Métadonnée `title` de la page traduite

**Exclus** :

- Fiche produit (`GET /v1/products/{id}`) et tout lien vers une fiche
- Page précédente, numéros de page, nombre total de produits (le backend ne les fournit pas)
- Choix de la taille de page par le visiteur
- Tri, recherche texte, filtre autre que la devise
- Conversion de prix d'une devise à une autre
- Panier, ajout au panier, stock, images de produit
- TanStack Query, route BFF `app/api/bff/**`, `nuqs`, composants shadcn/ui, TanStack Table
- Session et authentification (la page est publique)
- Tests de bout en bout (Playwright, Prism, axe) : reportés à la spec qui introduira l'outillage E2E
- Mise à jour de la copie du contrat `docs/api/backends/shop-api.openapi.json`

## User stories

### US-001 — Voir la première page du catalogue

**En tant que** visiteur **je veux** voir la liste des produits **afin de** découvrir ce que la boutique vend

```gherkin
Given un backend qui renvoie 20 produits et nextCursor "abc"
When je demande /fr/products
Then la page affiche un titre h1 traduit et une liste de 20 éléments, chacun avec le nom du produit et son prix formaté par formatMoney(amount, currency, "fr")
And le backend a reçu exactement un appel GET /v1/products avec limit=20, sans paramètre currency ni cursor, et l'en-tête Accept-Language "fr"

Given un backend qui renvoie le produit "Mug" au prix {"amount":"1234.50","currency":"EUR"}
When je demande /en/products
Then l'élément du produit "Mug" affiche "€1,234.50"

Given l'accueil /fr
When je suis le lien « Voir le catalogue »
Then j'arrive sur /fr/products
```

### US-002 — Parcourir les pages suivantes

**En tant que** visiteur **je veux** passer à la page suivante puis revenir au début **afin de** voir tout le catalogue

```gherkin
Given un backend qui renvoie nextCursor "abc"
When je demande /fr/products?currency=EUR
Then un lien « Page suivante » pointe vers /fr/products?currency=EUR&cursor=abc

Given un backend qui renvoie nextCursor null
When je demande /fr/products
Then aucun lien « Page suivante » n'est affiché

Given une page demandée avec cursor=abc
When je demande /fr/products?currency=EUR&cursor=abc
Then le backend reçoit cursor=abc et currency=EUR
And un lien « Première page » pointe vers /fr/products?currency=EUR

Given une page demandée sans cursor
When je demande /fr/products
Then aucun lien « Première page » n'est affiché
```

### US-003 — Filtrer par devise

**En tant que** visiteur **je veux** n'afficher que les produits vendus dans une devise **afin de** comparer des prix comparables

```gherkin
Given la page /fr/products
When elle s'affiche
Then un bloc de navigation propose 4 liens : « Toutes les devises » vers /fr/products, « EUR » vers /fr/products?currency=EUR, « USD » vers /fr/products?currency=USD, « GBP » vers /fr/products?currency=GBP
And le lien « Toutes les devises » porte aria-current="page"

Given la page /fr/products?currency=USD&cursor=abc
When elle s'affiche
Then le backend reçoit currency=USD
And le lien « USD » porte aria-current="page" et aucun autre lien du filtre ne le porte
And chaque lien du filtre pointe vers une URL sans paramètre cursor

Given la page /fr/products?currency=JPY&cursor=%24%24
When elle s'affiche
Then le backend reçoit un appel sans paramètre currency ni cursor
And le lien « Toutes les devises » porte aria-current="page"
```

### US-004 — Liste vide et erreur du backend

**En tant que** visiteur **je veux** un message clair quand il n'y a rien à afficher ou que le catalogue est indisponible **afin de** savoir quoi faire

```gherkin
Given un backend qui renvoie {"items":[],"nextCursor":null}
When je demande /fr/products?currency=GBP
Then la page affiche le message traduit catalog.empty, aucune liste de produits, et le filtre de devise

Given un backend qui répond 500, 400, ou ne répond pas avant 5 secondes
When je demande /fr/products?cursor=abc
Then la page répond, affiche dans un élément role="alert" le message errors.<code> s'il existe, sinon errors.generic
And un lien « Première page » pointe vers /fr/products
And le champ message du corps d'erreur du backend n'apparaît nulle part dans la page

Given un backend qui renvoie un corps non conforme au schéma (prix "12.5")
When je demande /fr/products
Then la page affiche le message d'erreur errors.generic dans un élément role="alert"
```

## Contrat d'API

### Exposé par l'application

Page HTML, pas d'API JSON :

`GET /[locale]/products?currency={EUR|USD|GBP}&cursor={curseur}`

| Paramètre  | Emplacement | Requis | Validation (Zod, `schemas/products.ts`)                 | Valeur invalide |
| ---------- | ----------- | ------ | ------------------------------------------------------- | --------------- |
| `locale`   | chemin      | oui    | `fr` ou `en` (`shared/i18n/routing.ts`)                 | 404 (socle)     |
| `currency` | requête     | non    | `EUR`, `USD` ou `GBP`, sensible à la casse              | ignoré          |
| `cursor`   | requête     | non    | chaîne de 1 à 200 caractères `^[A-Za-z0-9_-]+$`         | ignoré          |

Un paramètre répété (`?currency=EUR&currency=USD`) est invalide, donc ignoré.
La page répond `200` dans tous les cas où la locale est valide, y compris
quand le backend est en erreur (message dans la page).

### Consommé : shop-api `GET /v1/products`

Requête envoyée par `server/gateway.ts` via `backendRequest` :

```
GET /v1/products?limit=20&currency=EUR&cursor=abc
Accept: application/json
Accept-Language: fr
X-Request-Id: <uuid>
```

`currency` et `cursor` ne sont envoyés que s'ils sont présents et valides.

Réponse `200`, champs validés par le schéma Zod (les autres champs éventuels
sont ignorés) :

```json
{
  "type": "object",
  "required": ["items", "nextCursor"],
  "properties": {
    "items": {
      "type": "array",
      "maxItems": 100,
      "items": {
        "type": "object",
        "required": ["id", "name", "price"],
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "name": { "type": "string", "minLength": 1, "maxLength": 200 },
          "price": {
            "type": "object",
            "required": ["amount", "currency"],
            "properties": {
              "amount": { "type": "string", "pattern": "^\\d+\\.\\d{2}$" },
              "currency": { "enum": ["EUR", "USD", "GBP"] }
            }
          }
        }
      }
    },
    "nextCursor": { "type": ["string", "null"] }
  }
}
```

Réponses d'erreur du backend (`400`, `500`) :

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "texte du backend, jamais affiché",
  "details": [{ "path": "cursor", "message": "texte du backend, jamais affiché" }]
}
```

Erreurs retournées par la query à la page (format commun du socle,
`{ "code": string, "status": number }`) :

| Cas                                   | `code`                     | `status` |
| ------------------------------------- | -------------------------- | -------- |
| Réponse d'erreur du backend           | champ `code` du backend    | statut du backend |
| Corps d'erreur sans `code`            | `BACKEND_ERROR`            | statut du backend |
| Corps `200` non conforme au schéma    | `INVALID_BACKEND_RESPONSE` | 502      |
| Pas de réponse en 5 secondes          | `BACKEND_TIMEOUT`          | 504      |
| Backend injoignable                   | `BACKEND_UNAVAILABLE`      | 503      |

Affichage : `t('errors.<code>')` si la clé existe dans l'espace `errors`,
sinon `t('errors.generic')`.

## Contraintes non fonctionnelles

- Latence : un seul appel au backend par affichage de page (aucun appel en cascade) ; délai d'expiration de 5 secondes hérité de `backendRequest` ; au-delà, la page s'affiche avec le message d'erreur au lieu d'attendre
- Poids client : aucun `"use client"` dans `src/features/catalog/` ; dans `src/app/[locale]/products/`, seul `error.tsx` le porte ; la page fonctionne sans JavaScript (filtre et pagination sont des liens)
- Sécurité : le curseur et la devise sont validés par Zod avant d'être transmis au backend, et encodés par `URLSearchParams` ; noms de produits rendus comme texte (aucun `dangerouslySetInnerHTML`) ; `message` et `details` du backend jamais affichés ; adresse du backend jamais exposée au navigateur
- Montants : affichés par `formatMoney` à partir de la chaîne du backend, jamais convertis en nombre
- Accessibilité (WCAG 2.2 AA) : un seul `h1` ; liste en `<ul>` ; filtre dans un `<nav>` avec `aria-label` traduit ; lien actif marqué `aria-current="page"` ; erreur dans `role="alert"`
- Coût : aucun service ni dépendance ajouté ; page dynamique (`searchParams`), aucun cache côté Next.js (`cache: "no-store"` du socle)
- Dépendances : aucune nouvelle ; le plan de test utilise `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw` et `next-intl` (`NextIntlClientProvider` pour rendre les composants avec les vrais fichiers de traduction), déjà présents dans `package.json`

## Plan de test

| Id  | Niveau            | Scénario                                                                                                                         | Attendu                                                                                                                                       | Couvre         |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| T1  | unit              | Schéma des paramètres d'URL sur `{currency:"EUR",cursor:"abc"}`, `{currency:"JPY"}`, `{currency:"eur"}`, `{cursor:"$$"}`, `{currency:["EUR","USD"]}`, `{}` | premier cas conservé tel quel ; les autres donnent `{}` (paramètre invalide retiré)                                                           | US-003         |
| T2  | unit              | Schéma de réponse sur un corps conforme, puis sur un prix `"12.5"`, puis sans `nextCursor`                                      | premier accepté ; deux suivants refusés                                                                                                       | US-001, US-004 |
| T3  | unit              | `productsSearchParams` sur `{}`, `{currency:"EUR"}`, `{cursor:"abc"}`, `{currency:"EUR",cursor:"abc"}`                          | `""`, `"currency=EUR"`, `"cursor=abc"`, `"currency=EUR&cursor=abc"`                                                                           | US-002, US-003 |
| T4  | unit              | Mapper sur une réponse de 2 produits et `nextCursor:"abc"`                                                                       | `ProductListPage` de 2 éléments (`id`, `name`, `amount`, `currency`) et `nextCursor:"abc"`                                                    | US-001         |
| T5  | intégration (MSW) | `getProductListPage({locale:"fr"})` sur 20 produits                                                                              | succès de 20 éléments ; un seul appel reçu par MSW, avec `limit=20`, sans `currency` ni `cursor`, `Accept-Language: fr`                     | US-001         |
| T6  | intégration (MSW) | `getProductListPage({locale:"fr",currency:"USD",cursor:"abc"})`                                                                  | MSW reçoit `limit=20`, `currency=USD`, `cursor=abc`                                                                                           | US-002, US-003 |
| T7  | intégration (MSW) | `getProductListPage` sur une réponse 500 `{"code":"INTERNAL_ERROR",…}`, une réponse 400 `{"code":"VALIDATION_FAILED",…}`, un corps non conforme | erreurs `INTERNAL_ERROR`/500, `VALIDATION_FAILED`/400, `INVALID_BACKEND_RESPONSE`/502 ; aucune exception levée                               | US-004         |
| T8  | composant         | `ProductList` rendu en `en` avec le produit « Mug » à `1234.50 EUR`, messages chargés depuis les vrais fichiers                 | un `listitem` contient « Mug » et `€1,234.50` (espaces insécables normalisés)                                                                 | US-001         |
| T9  | composant         | `CurrencyFilter` rendu en `fr` avec `currency:"USD"`                                                                             | rôle `navigation` nommé ; 4 liens aux `href` de US-003 ; seul « USD » a `aria-current="page"` ; aucun `href` ne contient `cursor`             | US-003         |
| T10 | composant         | `CurrencyFilter` rendu sans devise                                                                                               | seul « Toutes les devises » a `aria-current="page"`                                                                                           | US-003         |
| T11 | composant         | `ProductPagination` avec `{currency:"EUR", cursor:"abc", nextCursor:"def"}`, puis `{nextCursor:null}` sans `cursor`             | 1er : « Page suivante » vers `/fr/products?currency=EUR&cursor=def` et « Première page » vers `/fr/products?currency=EUR` ; 2e : aucun lien | US-002         |
| T12 | composant         | `ProductListEmpty` en `fr`                                                                                                       | texte de `catalog.empty` de `src/features/catalog/messages/fr.json`                                                                           | US-004         |
| T13 | composant         | `ProductListError` avec `{code:"BACKEND_TIMEOUT"}` puis `{code:"UNKNOWN_CODE"}`                                                 | élément `role="alert"` ; 1er : texte de `errors.BACKEND_TIMEOUT` ; 2e : texte de `errors.generic` ; lien « Première page » dans les deux cas | US-004         |
| T14 | composant         | `CatalogLink` rendu en `fr` (composé par l'accueil)                                                                              | lien nommé par `catalog.viewCatalog`, `href` `/fr/products`                                                                                   | US-001         |
| T15 | structure         | Parité des traductions, dont `src/features/catalog/messages/`                                                                    | `pnpm lint:architecture` sort en 0                                                                                                            | US-001         |
| T16 | structure         | Aucune feature n'en importe une autre ; `app/` n'importe que `features/catalog` et `features/catalog/server`                     | `harness gate arch --rule next-no-cross-feature` et `harness gate arch --rule next-app-feature-public-api-only` sortent en 0                 | US-001         |
| T17 | structure         | `index.ts` client-safe ; `model/` pur                                                                                             | `harness gate arch --rule next-index-client-safe` et `harness gate arch --rule next-model-pure` sortent en 0                                 | US-001         |
| T18 | structure         | Aucun `fetch` hors `shared/api`                                                                                                  | `harness gate arch --rule next-no-fetch-outside-api` sort en 0                                                                                | US-001         |
| T19 | structure         | Aucune arithmétique sur les montants                                                                                             | `harness gate arch --rule next-no-amount-arithmetic` sort en 0                                                                                | US-001         |
| T20 | structure         | Liens par `shared/i18n/navigation` uniquement                                                                                    | `harness gate arch --rule next-i18n-navigation` sort en 0                                                                                     | US-002, US-003 |
| T21 | structure         | Aucun `dangerouslySetInnerHTML` ; aucun `"use client"` sur une page                                                              | `harness gate arch --rule next-no-dangerous-html` et `harness gate arch --rule next-no-use-client-on-routes` sortent en 0                    | US-001         |
| T22 | structure         | Aucun texte d'interface en dur, typage et build                                                                                  | `pnpm lint`, `pnpm typecheck` et `pnpm build` sortent en 0                                                                                    | US-001         |

Les Server Components asynchrones (`page.tsx`) sont couverts par leurs
queries (T5 à T7) et par les composants synchrones qu'ils composent (T8 à
T13), conformément à la règle `testing`.

## Risques

- **Sens du paramètre `currency`** : le contrat OpenAPI dit seulement que `currency` est un paramètre optionnel (`EUR`, `USD`, `GBP`). La spec `catalog-currency-filter` de shop-api précise qu'il filtre sur la devise stockée du prix, sans conversion. Si shop-api change ce comportement sans changer le contrat, la vérification après déploiement le détecte : tous les prix affichés sont dans la devise demandée, et sur un jeu de données mixte, la liste filtrée est plus courte que la liste complète
- **Curseur périmé ou forgé** : un curseur au bon format mais inconnu du backend produit une erreur `400` ; la page affiche le message d'erreur et le lien « Première page » (T7, T13)
- **Chargement des messages de la feature** : `src/app/_i18n/request.ts` doit composer `loadCatalogMessages` et `next.config.ts` pointer vers lui ; un oubli se voit au rendu de `/fr/products` (clé `catalog.*` manquante) ; T8 à T14 chargent les vrais fichiers de traduction
- **API de next-intl 4 / Next.js 16** (`searchParams` asynchrones, `useTranslations` dans un Server Component synchrone) : lire `node_modules/next/dist/docs/` et la documentation de next-intl avant d'écrire ; un écart se voit au build et au typecheck
- **Formatage monétaire dépendant de l'ICU de Node** : assertions sur la valeur aux espaces insécables normalisés (même approche que T8 du socle)
- **Évolution du contrat** : un champ renommé chez shop-api fait échouer le schéma Zod et affiche `errors.generic` (erreur `INVALID_BACKEND_RESPONSE` visible dans les journaux) ; la copie du contrat ne bouge que par un geste humain

## Déploiement et retour arrière

- **Ordre de mise en place** : shop-api expose `GET /v1/products` conforme au commit `27625d9` dans l'environnement cible, puis déploiement de shop-web ; aucune nouvelle variable d'environnement (`BACKEND_API_URL` existe déjà) ; aucune migration
- **Compatibilité** : ajout pur (nouvelle route, nouveau lien sur l'accueil) ; la version précédente de shop-web tourne sur la même configuration et le même backend
- **Retour arrière** : redéployer la version précédente de shop-web ; rien n'est perdu (la feature n'écrit aucune donnée) ; les URL `/[locale]/products` répondent alors 404
- **Vérification après déploiement** : `/fr/products` répond 200 et affiche au plus 20 produits avec des prix formatés ; `/fr/products?currency=EUR` n'affiche que des prix en euros ; si le backend renvoie un `nextCursor`, le lien « Page suivante » mène à une page différente ; `GET /api/health` renvoie toujours 200
