# Spec : catalog-product-detail

- **Statut** : Implemented
- **Auteur** : Claude (à relire par l'équipe)
- **Version** : 0.1.0
- **Liée à** : `docs/specs/catalog-products-list.md` (feature `catalog`, `ProductList`, `ProductListError`, `CatalogLink`, `productsSearchParams`, handlers MSW) ; `docs/specs/web-foundation.md` (socle : `backendRequest`, `Result`, `formatMoney`, i18n) ; règles `.claude/rules/nextjs/` (features, feature-server, app-routes, model-schemas, i18n, ui, testing) ; contrat `docs/api/backends/shop-api.openapi.json` (commit `27625d9`), opération `CatalogController_getProduct_v1`
- **Révisions** : aucune

> **Choix à relire avant d'approuver.** Ils découlent du contrat de shop-api
> et des règles de la stack ; modifiez-les ici si besoin.
>
> | Choix                          | Valeur proposée                                                                                                                                                                     |
> | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | Feature                        | `catalog` (extension de `src/features/catalog/`, pas de nouvelle feature)                                                                                                           |
> | URL de la page                 | `/[locale]/products/[id]` (`/fr/products/<uuid>`, `/en/products/<uuid>`)                                                                                                            |
> | Contenu de la fiche            | Ce que le contrat fournit : nom et prix (`id` sert à l'URL). Ni description, ni image, ni stock : le contrat ne les expose pas                                                      |
> | Lien depuis la liste           | Le nom de chaque produit de la liste devient un lien vers sa fiche                                                                                                                  |
> | Retour à la liste              | Lien « Retour au catalogue » vers `/products` sans paramètre (le filtre et le curseur de la liste ne sont pas reportés dans l'URL de la fiche ; le bouton Précédent du navigateur les restaure) |
> | Identifiant invalide ou inconnu | Page « introuvable » (`notFound()`), sans appel au backend quand l'identifiant n'est pas un UUID ; un `404` du backend donne le même rendu                                         |
> | Autres erreurs du backend      | Message dans la page (`role="alert"`) avec lien « Retour au catalogue », comme la liste ; la page ne plante pas                                                                    |
> | Titre de l'onglet              | Le nom du produit ; `getProductDetail` est mémorisée par `cache()` de React, donc `generateMetadata` et la page partagent un seul appel au backend. Repli : texte traduit « Produit » quand le produit n'est pas affiché (introuvable, erreur) |

## Contexte

La liste du catalogue (`catalog-products-list`) affiche nom et prix mais
aucun produit n'est consultable seul : la fiche produit était exclue de
cette spec. shop-api expose `GET /v1/products/{id}`. Cette feature ajoute la
page d'un produit, atteinte depuis la liste, avec son prix formaté selon la
locale du visiteur.

## Périmètre

**Inclus** :

- Extension de la feature `src/features/catalog/` :
  - `schemas/products.ts` : schéma Zod écrit à la main de la réponse de `GET /v1/products/{id}`, limité aux champs `id`, `name`, `price.amount`, `price.currency` ; schéma `productIdSchema` (`z.uuid()`) de l'identifiant de l'URL
  - `model/products.ts` : type de vue `ProductDetail` (`id`, `name`, `amount`, `currency`) ; fonction pure `productDetailTitle(product, fallback)` qui renvoie `product.name` si `product` est défini, sinon `fallback`
  - `server/gateway.ts` : `getProduct({ id, locale })` au-dessus de `backendRequest`, appelle `/v1/products/<id>` (identifiant encodé par `encodeURIComponent`), retourne `Result`
  - `server/mappers.ts` : réponse backend → `ProductDetail`
  - `server/queries.ts` : `getProductDetail({ id, locale })`, retourne `Result<ProductDetail, BackendError>` ; la fonction exportée est enveloppée par `cache()` de React (les arguments sont des chaînes, donc comparés par valeur) pour que `generateMetadata` et la page partagent un seul appel
  - `server.ts` : réexporte `getProductDetail` et `productIdSchema` ; `index.ts` : réexporte les nouveaux composants et le type `ProductDetail`
  - `components/` (Server Components synchrones, aucun `"use client"`) : `ProductDetailView` (nom et prix formaté par `formatMoney`), `ProductDetailError` (`role="alert"`), `ProductNotFound`, `BackToCatalogLink` ; `ProductList` modifié pour que le nom de chaque produit soit un lien vers `/products/<id>`
  - `messages/fr.json` et `messages/en.json` : clés `catalog.productTitle`, `catalog.backToCatalog`, `catalog.productNotFound`, mêmes clés dans les deux langues
  - `__mocks__/handlers.ts` : handlers MSW de `GET /v1/products/:id` (produit, `404`, `500`, corps non conforme)
- Route `src/app/[locale]/products/[id]/` : `page.tsx` (valide l'identifiant par `productIdSchema`, appelle `getProductDetail`, compose les composants, un seul `h1`) et `not-found.tsx` (compose `ProductNotFound`) ; la page hérite de `loading.tsx` et `error.tsx` de `src/app/[locale]/products/`
- Métadonnée `title` de la page : `generateMetadata` valide l'identifiant, appelle le même `getProductDetail` que la page et renvoie `productDetailTitle(produit, t("productTitle"))` ; aucun appel au backend si l'identifiant n'est pas un UUID

**Exclus** :

- Description, image, stock, avis, variantes : absents du contrat
- Ajout au panier, achat, comparaison
- Report du filtre de devise et du curseur de la liste dans l'URL de la fiche
- Produits liés, produit précédent / suivant
- TanStack Query, route BFF `app/api/bff/**`, `nuqs`, composants shadcn/ui
- Session et authentification (la page est publique)
- Tests de bout en bout (Playwright, Prism, axe) : reportés à la spec qui introduira l'outillage E2E
- Mise à jour de la copie du contrat `docs/api/backends/shop-api.openapi.json`

## User stories

### US-001 — Voir la fiche d'un produit

**En tant que** visiteur **je veux** voir le nom et le prix d'un produit **afin de** savoir ce qu'il coûte

```gherkin
Given un backend qui renvoie le produit {"id":"00000000-0000-4000-8000-000000000001","name":"Mug","price":{"amount":"1234.50","currency":"EUR"}}
When je demande /en/products/00000000-0000-4000-8000-000000000001
Then la page affiche un seul titre h1 contenant "Mug" et le prix "€1,234.50" formaté par formatMoney(amount, currency, "en")
And le backend a reçu exactement un appel GET /v1/products/00000000-0000-4000-8000-000000000001 avec l'en-tête Accept-Language "en", pour la page et son titre ensemble
And le titre du document est "Mug"

Given le même produit
When je demande /fr/products/00000000-0000-4000-8000-000000000001
Then le prix affiché est celui de formatMoney("1234.50", "EUR", "fr")
And le backend a reçu l'en-tête Accept-Language "fr"
```

### US-002 — Aller de la liste à la fiche et revenir

**En tant que** visiteur **je veux** ouvrir un produit depuis la liste puis revenir à la liste **afin de** parcourir le catalogue

```gherkin
Given la liste /fr/products qui affiche le produit "Produit 1" d'identifiant 00000000-0000-4000-8000-000000000000
When elle s'affiche
Then le nom "Produit 1" est un lien vers /fr/products/00000000-0000-4000-8000-000000000000
And chaque produit de la liste a un lien vers sa propre fiche

Given la fiche /fr/products/00000000-0000-4000-8000-000000000000 qui s'affiche
When je regarde les liens de la page
Then un lien « Retour au catalogue » pointe vers /fr/products
```

### US-003 — Produit introuvable

**En tant que** visiteur **je veux** un message clair quand le produit n'existe pas **afin de** ne pas rester sur une page vide

```gherkin
Given l'URL /fr/products/pas-un-uuid
When je la demande
Then la page « introuvable » affiche le message traduit catalog.productNotFound et un lien « Retour au catalogue » vers /fr/products
And le backend n'a reçu aucun appel
And le titre du document est le texte traduit catalog.productTitle

Given un backend qui répond 404 {"statusCode":404,"code":"PRODUCT_NOT_FOUND","message":"texte du backend","details":[]} pour l'identifiant 00000000-0000-4000-8000-0000000000ff
When je demande /fr/products/00000000-0000-4000-8000-0000000000ff
Then la page « introuvable » affiche le message traduit catalog.productNotFound et un lien « Retour au catalogue » vers /fr/products
And le champ message du corps d'erreur du backend n'apparaît nulle part dans la page
```

### US-004 — Erreur du backend

**En tant que** visiteur **je veux** un message clair quand le catalogue est indisponible **afin de** savoir quoi faire

```gherkin
Given un backend qui répond 500, 400, ou ne répond pas avant 5 secondes
When je demande /fr/products/00000000-0000-4000-8000-000000000001
Then la page répond, affiche dans un élément role="alert" le message errors.<code> s'il existe, sinon errors.generic
And un lien « Retour au catalogue » pointe vers /fr/products
And le champ message du corps d'erreur du backend n'apparaît nulle part dans la page

Given un backend qui renvoie un corps non conforme au schéma (prix "12.5")
When je demande /fr/products/00000000-0000-4000-8000-000000000001
Then la page affiche le message d'erreur errors.generic dans un élément role="alert"
```

## Contrat d'API

### Exposé par l'application

Page HTML, pas d'API JSON :

`GET /[locale]/products/{id}`

| Paramètre | Emplacement | Requis | Validation (Zod, `schemas/products.ts`) | Valeur invalide                 |
| --------- | ----------- | ------ | --------------------------------------- | ------------------------------- |
| `locale`  | chemin      | oui    | `fr` ou `en` (`shared/i18n/routing.ts`) | 404 (socle)                     |
| `id`      | chemin      | oui    | UUID (`z.uuid()`)                       | page « introuvable », pas d'appel au backend |

Une locale valide avec un produit existant, une erreur du backend ou un
produit inconnu rend une page de la feature (fiche, message d'erreur ou page
« introuvable »). Le code HTTP d'une page « introuvable » n'est pas un
critère de cette spec (voir Risques).

### Consommé : shop-api `GET /v1/products/{id}`

Requête envoyée par `server/gateway.ts` via `backendRequest` :

```
GET /v1/products/00000000-0000-4000-8000-000000000001
Accept: application/json
Accept-Language: fr
X-Request-Id: <uuid>
```

Réponse `200`, champs validés par le schéma Zod (les autres champs éventuels
sont ignorés) :

```json
{
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
```

Réponses d'erreur du backend (`400`, `404`, `500`), même forme que pour la liste :

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "texte du backend, jamais affiché",
  "details": [{ "path": "id", "message": "texte du backend, jamais affiché" }]
}
```

Erreurs retournées par la query à la page (format commun du socle,
`{ "code": string, "status": number }`) :

| Cas                                | `code`                     | `status`          | Rendu                  |
| ---------------------------------- | -------------------------- | ----------------- | ---------------------- |
| Réponse `404` du backend           | champ `code` du backend    | 404               | page « introuvable »   |
| Autre réponse d'erreur du backend  | champ `code` du backend    | statut du backend | `ProductDetailError`   |
| Corps d'erreur sans `code`         | `BACKEND_ERROR`            | statut du backend | `ProductDetailError`   |
| Corps `200` non conforme au schéma | `INVALID_BACKEND_RESPONSE` | 502               | `ProductDetailError`   |
| Pas de réponse en 5 secondes       | `BACKEND_TIMEOUT`          | 504               | `ProductDetailError`   |
| Backend injoignable                | `BACKEND_UNAVAILABLE`      | 503               | `ProductDetailError`   |

Affichage de `ProductDetailError` : `t('errors.<code>')` si la clé existe
dans l'espace `errors`, sinon `t('errors.generic')`.

## Contraintes non fonctionnelles

- Latence : un seul appel au backend par affichage de page, partagé entre le titre et le contenu par `cache()` de React, zéro appel quand l'identifiant n'est pas un UUID ; délai d'expiration de 5 secondes hérité de `backendRequest`
- Poids client : aucun `"use client"` dans `src/features/catalog/` ; dans `src/app/[locale]/products/[id]/`, aucun fichier ne le porte ; la page fonctionne sans JavaScript
- Sécurité : l'identifiant est validé par Zod avant d'être placé dans le chemin de l'appel backend, et encodé par `encodeURIComponent` ; le nom du produit est rendu comme texte (aucun `dangerouslySetInnerHTML`) ; `message` et `details` du backend jamais affichés ; adresse du backend jamais exposée au navigateur
- Montants : affichés par `formatMoney` à partir de la chaîne du backend, jamais convertis en nombre
- Accessibilité (WCAG 2.2 AA) : un seul `h1` ; erreur dans `role="alert"` ; liens avec un nom explicite
- Coût : aucun service ni dépendance ajouté ; page dynamique, aucun cache côté Next.js (`cache: "no-store"` du socle)
- Dépendances : aucune nouvelle ; le plan de test utilise `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw` et `next-intl` (`NextIntlClientProvider` avec les vrais fichiers de traduction), déjà présents dans `package.json`

## Plan de test

| Id  | Niveau            | Scénario                                                                                                                                 | Attendu                                                                                                                                                     | Couvre                 |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| T1  | unit              | `productIdSchema` sur `00000000-0000-4000-8000-000000000001`, `pas-un-uuid`, `""`, `../products`, `["a","b"]`                           | premier accepté ; les quatre autres refusés                                                                                                                 | US-003                 |
| T2  | unit              | Schéma de réponse détail sur un corps conforme, puis sur un prix `"12.5"`, puis sans `name`                                              | premier accepté ; deux suivants refusés                                                                                                                     | US-001, US-004         |
| T3  | unit              | Mapper détail sur `{id,name:"Mug",price:{amount:"1234.50",currency:"EUR"}}`                                                              | `ProductDetail` `{id,name:"Mug",amount:"1234.50",currency:"EUR"}`                                                                                           | US-001                 |
| T4  | intégration (MSW) | `getProductDetail({id:"00000000-0000-4000-8000-000000000001",locale:"fr"})` sur un produit conforme                                      | succès avec le produit ; un seul appel reçu par MSW, sur le chemin `/v1/products/00000000-0000-4000-8000-000000000001`, `Accept-Language: fr`              | US-001                 |
| T5  | intégration (MSW) | `getProductDetail` sur une réponse 404 `{"code":"PRODUCT_NOT_FOUND","message":"texte du backend"}`                                                                  | erreur `PRODUCT_NOT_FOUND` / 404 ; aucune exception levée                                                                                                   | US-003                 |
| T6  | intégration (MSW) | `getProductDetail` sur une réponse 500 `{"code":"INTERNAL_ERROR","message":"texte du backend"}`, une réponse 400 `{"code":"VALIDATION_FAILED","message":"texte du backend"}`, un corps non conforme, une réponse après 6 secondes avec `timeoutMs` réduit | erreurs `INTERNAL_ERROR`/500, `VALIDATION_FAILED`/400, `INVALID_BACKEND_RESPONSE`/502, `BACKEND_TIMEOUT`/504 ; aucune exception levée | US-004                 |
| T7  | composant         | `ProductDetailView` rendu en `en` avec « Mug » à `1234.50 EUR`, messages chargés depuis les vrais fichiers                              | un seul `heading` de niveau 1 contenant « Mug » ; le texte `€1,234.50` est présent (espaces insécables normalisés)                                         | US-001                 |
| T8  | composant         | `ProductDetailView` rendu en `fr` avec le même produit                                                                                   | le prix affiché est `formatMoney("1234.50","EUR","fr")` (espaces insécables normalisés)                                                                    | US-001                 |
| T9  | composant         | `ProductList` rendu en `fr` avec deux produits d'identifiants distincts                                                                  | chaque nom est un `link` dont le `href` est `/fr/products/<id>` de son produit ; les deux `href` diffèrent                                                  | US-002                 |
| T10 | composant         | `BackToCatalogLink` rendu en `fr`                                                                                                        | lien nommé par `catalog.backToCatalog`, `href` `/fr/products`                                                                                               | US-002                 |
| T11 | composant         | `ProductNotFound` rendu en `fr`                                                                                                          | texte de `catalog.productNotFound` de `src/features/catalog/messages/fr.json` ; lien « Retour au catalogue » vers `/fr/products`                           | US-003                 |
| T12 | composant         | `ProductDetailError` avec `{code:"BACKEND_TIMEOUT"}` puis `{code:"UNKNOWN_CODE"}`                                                       | élément `role="alert"` ; 1er : texte de `errors.BACKEND_TIMEOUT` ; 2e : texte de `errors.generic` ; lien « Retour au catalogue » dans les deux cas         | US-004                 |
| T13 | structure         | Parité des traductions, dont `src/features/catalog/messages/`                                                                            | `pnpm lint:architecture` sort en 0                                                                                                                          | US-002, US-003         |
| T14 | structure         | Aucune feature n'en importe une autre ; `app/` n'importe que `features/catalog` et `features/catalog/server`                             | `harness gate arch --rule next-no-cross-feature` et `harness gate arch --rule next-app-feature-public-api-only` sortent en 0                               | US-001                 |
| T15 | structure         | `index.ts` client-safe ; `model/` pur ; aucun `fetch` hors `shared/api`                                                                  | `harness gate arch --rule next-index-client-safe`, `harness gate arch --rule next-model-pure` et `harness gate arch --rule next-no-fetch-outside-api` sortent en 0 | US-001                 |
| T16 | structure         | Aucune arithmétique sur les montants ; liens par `shared/i18n/navigation` uniquement                                                     | `harness gate arch --rule next-no-amount-arithmetic` et `harness gate arch --rule next-i18n-navigation` sortent en 0                                       | US-001, US-002         |
| T17 | structure         | Aucun `dangerouslySetInnerHTML` ; aucun `"use client"` sur une page                                                                      | `harness gate arch --rule next-no-dangerous-html` et `harness gate arch --rule next-no-use-client-on-routes` sortent en 0                                  | US-001                 |
| T18 | structure         | Aucun texte d'interface en dur, typage et build                                                                                          | `pnpm lint`, `pnpm typecheck` et `pnpm build` sortent en 0                                                                                                  | US-001, US-002, US-003, US-004 |
| T19 | unit              | `productDetailTitle` avec le produit « Mug » et le repli « Produit », puis avec `undefined` et le repli « Produit »                      | « Mug » ; « Produit »                                                                                                                                       | US-001, US-003         |

Les Server Components asynchrones (`page.tsx`) sont couverts par leur query
(T4 à T6) et par les composants synchrones qu'ils composent (T7 à T12),
conformément à la règle `testing`. Le test existant de `ProductList`
(`product-list.test.tsx`) est mis à jour pour le lien (T9).

## Risques

- **Code HTTP d'une page « introuvable »** : `products/loading.tsx` est hérité par la fiche ; Next.js peut avoir envoyé l'entête `200` avant que `notFound()` ne soit levé (rendu en flux). Le visiteur voit bien la page « introuvable » mais le code HTTP peut rester `200`. La spec ne l'exige donc pas ; lire `node_modules/next/dist/docs/` avant d'écrire la page, et si un vrai `404` est voulu (référencement), prévoir une spec dédiée
- **Forme de l'identifiant** : `z.uuid()` doit accepter les mêmes identifiants que le backend (le motif du contrat admet aussi l'UUID nul et l'UUID maximal). Si les deux divergent, un identifiant valide chez le backend s'affiche « introuvable » ; la vérification après déploiement ouvre un produit réel depuis la liste
- **Appel unique non vérifiable par Vitest** : `cache()` de React ne mémorise que pendant un rendu serveur React ; hors rendu (test de la query avec MSW) il appelle directement la fonction. Le partage d'appel entre `generateMetadata` et la page ne se prouve donc pas par un test automatique de cette spec ; il se vérifie après déploiement (un seul appel `GET /v1/products/<id>` par affichage dans les journaux du backend). Le `fetch` de `backendRequest` porte un `AbortSignal`, ce qui empêche a priori la mémorisation des `fetch` par Next.js : sans `cache()`, le backend recevrait deux appels. À confirmer dans `node_modules/next/dist/docs/` avant d'écrire
- **Liste et fiche désynchronisées** : un produit supprimé entre l'affichage de la liste et le clic donne la page « introuvable » (US-003), comportement voulu
- **API de next-intl 4 / Next.js 16** (`params` asynchrones, `notFound()`, `not-found.tsx` de segment, `useTranslations` dans un Server Component synchrone) : lire `node_modules/next/dist/docs/` avant d'écrire ; un écart se voit au build et au typecheck
- **Formatage monétaire dépendant de l'ICU de Node** : assertions sur la valeur aux espaces insécables normalisés (même approche que T8 de `catalog-products-list`)
- **Évolution du contrat** : un champ renommé chez shop-api fait échouer le schéma Zod et affiche `errors.generic` (erreur `INVALID_BACKEND_RESPONSE` visible dans les journaux) ; la copie du contrat ne bouge que par un geste humain
- **Changement de `ProductList`** : le nom devient un lien ; le test existant et son attendu (nom et prix dans un `listitem`) restent valables

## Déploiement et retour arrière

- **Ordre de mise en place** : shop-api expose `GET /v1/products/{id}` conforme au commit `27625d9` dans l'environnement cible, puis déploiement de shop-web ; aucune nouvelle variable d'environnement (`BACKEND_API_URL` existe déjà) ; aucune migration
- **Compatibilité** : ajout d'une route et de liens dans la liste ; la version précédente de shop-web tourne sur la même configuration et le même backend
- **Retour arrière** : redéployer la version précédente de shop-web ; rien n'est perdu (la feature n'écrit aucune donnée) ; les URL `/[locale]/products/<id>` répondent alors 404 et la liste n'a plus de liens
- **Vérification après déploiement** : depuis `/fr/products`, un clic sur un produit ouvre `/fr/products/<id>` qui affiche son nom et son prix, identiques à ceux de la liste, et le titre de l'onglet est le nom du produit ; les journaux du backend montrent un seul appel `GET /v1/products/<id>` pour cet affichage ; `/fr/products/pas-un-uuid` affiche la page « introuvable » ; `GET /api/health` renvoie toujours 200
