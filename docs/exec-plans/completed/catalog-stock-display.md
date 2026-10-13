# Plan d'exécution : catalog-stock-display

- **Statut** : COMPLETED
- **Taille** : S
- **Durée attendue** : à mesurer (aucun cycle de taille S sur ce poste ; `.claude/state/cycle-times.json` ne contient qu'un cycle M)
- **Points d'arrêt** : aucun
  **Note** : l'humain approuve ce plan en tapant `/harness:ship docs/specs/catalog-stock-display.md --continue` ; il passe `COMPLETED` sur preuve en fin de cycle (toutes les cases cochées, `harness verify` vert).

- **Spec** : `docs/specs/catalog-stock-display.md` (Approved, v0.1.0, aucune révision)
- **Règles** : `.claude/rules/nextjs/` (general, features, feature-server, feature-client, model-schemas, i18n, ui, testing)
- **Contrat consommé** : `docs/api/backends/shop-api.openapi.json` (shop-api v1.2.1), opérations `CatalogController_listProducts_v1` et `CatalogController_getProduct_v1` ; `stock` lu optionnel (écart voulu, voir la spec)
- **Révisions du plan** : aucune

## Questions à l'humain

1. La spec répète deux fois la ligne « Champ présent mais invalide » dans le
   tableau des choix (lignes 19 et 20, contenu identique). Sans effet sur le
   plan ; laisser la spec telle quelle (pas de révision pour un doublon) ?
   **Réponse de l'humain : oui, laisser le doublon.**
2. La spec impose `stock: 5` par défaut dans `makeProducts`, mais ne dit rien
   de `DEFAULT_PRODUCT` (fiche). Le test existant `getProductDetail` « T4 »
   (`server/product-detail.test.ts`) compare la valeur entière par `toEqual`
   sans `inStock` : si `DEFAULT_PRODUCT` gagnait un `stock`, ce test devrait
   changer. Garder `DEFAULT_PRODUCT` sans `stock` (les cas avec stock passent
   un produit explicite à `productHandler`) ? **Réponse de l'humain : oui,
   `DEFAULT_PRODUCT` sans `stock` couvre le cas d'un shop-api antérieur
   (champ absent, page normale, aucun état affiché).**

## Constat de départ (code lu)

- `schemas/products.ts` : un seul `productSchema` (non exporté) partagé par
  `productListResponseSchema.items` et `productDetailResponseSchema` (alias
  direct) ; zod 4 (`z.uuid()`). Ajouter `stock` à `productSchema` couvre les
  deux réponses.
- `model/products.ts` : `ProductListItem` et `ProductDetail` (types distincts,
  mêmes champs `id`, `name`, `amount`, `currency`), `productDetailTitle`,
  `productsSearchParams`. Pas encore de `isInStock`.
- `server/mappers.ts` : `toProductDetail` et `toProductListPage` construisent
  les objets champ par champ (aucun spread de la réponse) : `stock` n'est donc
  pas transmis tant qu'on ne l'ajoute pas explicitement.
- `server/queries.ts` : `getProductListPage` et `getProductDetail` (via
  `cache()`) appellent les mappers ; rien à y changer.
- `__mocks__/handlers.ts` : `MockProduct` sans `stock` ; `makeProducts(count)`,
  `productsHandler({ count, nextCursor })`, `productHandler(product = DEFAULT_PRODUCT)`,
  `invalidProductsHandler`, `invalidProductHandler`, `slow…Handler`.
- Composants : `ProductList` (`<li>` = `Link` nom + `<span>` prix via
  `formatMoney`), `ProductDetailView` (`h1` nom, `<p>` prix, `BackToCatalogLink`).
  Les composants utilisent `useTranslations("catalog")` (ex. `ProductNotFound`),
  sans `"use client"`.
- Tests existants : `schemas/products.test.ts`, `model/products.test.ts`,
  `server/mappers.test.ts` (`toEqual`), `server/queries.test.ts` et
  `server/product-detail.test.ts` (MSW Node, `onUnhandledFrame: "error"`),
  `components/product-list.test.tsx` et `product-detail-view.test.tsx`
  (`NextIntlClientProvider` avec `{ ...rootFr, catalog: catalogFr }`). Leurs
  titres portent déjà des identifiants `T1`…`T7` des specs précédentes : les
  nouveaux tests sont préfixés `stock T<n>` (ex. `"stock T4: …"`) pour ne pas
  être confondus.
- Pages `src/app/[locale]/products/page.tsx` et `[id]/page.tsx` : importent
  `ProductList` / `ProductDetailView` depuis `@/features/catalog` ; aucune page
  n'importera `StockStatus`, donc `index.ts` ne change pas (spec). Aucune API
  Next.js nouvelle n'est utilisée (pas de page modifiée).

## Étapes

### Étape 1 : `stock` lu, validé et mappé en `inStock` (schéma, modèle, mappers, handlers MSW)

**Fichiers** :
- `src/features/catalog/schemas/products.ts` : `productSchema` gagne
  `stock: z.number().int().min(0).max(2147483647).optional()`
- `src/features/catalog/model/products.ts` : `isInStock(stock: number): boolean`
  (`stock > 0`) ; `inStock?: boolean` sur `ProductListItem` et `ProductDetail`
- `src/features/catalog/server/mappers.ts` : `inStock` = `isInStock(stock)`
  quand `stock` est présent, `undefined` sinon ; `stock` jamais recopié
- `src/features/catalog/__mocks__/handlers.ts` : `MockProduct` gagne
  `stock?: number` ; `makeProducts(count, overrides?)` renvoie `stock: 5` par
  défaut, surchargeable produit par produit (dont `name` et `stock`) ;
  `productsHandler` accepte une liste `items` explicite ; un handler de liste
  sans `stock` (shop-api antérieur à 1.2.0) ; un handler de liste et un handler
  de fiche renvoyant une valeur de `stock` arbitraire (`unknown`, pour `-1` et
  `null`). `DEFAULT_PRODUCT` reste sans `stock` (question 2)
- Tests : `schemas/products.test.ts`, `model/products.test.ts`,
  `server/mappers.test.ts`, `server/queries.test.ts`,
  `server/product-detail.test.ts` (nouveaux cas ajoutés, cas existants inchangés)

**Critères de succès** :
- [x] stock T1 passe : `productListResponseSchema` et `productDetailResponseSchema` acceptent un produit avec `stock` 0, 12, 2147483647 et un produit sans `stock`
- [x] stock T2 passe : les deux schémas refusent `stock` `-1`, `2.5`, `null`, `"3"` et `2147483648`
- [x] stock T3 passe : `isInStock(0)` vaut `false`, `isInStock(1)` et `isInStock(2147483647)` valent `true`
- [x] stock T4 passe : `toProductListPage` et `toProductDetail` donnent `inStock` `true` (stock 12), `false` (stock 0), `undefined` (sans stock), et `"stock" in produit` vaut `false` dans les trois cas
- [x] stock T5 passe : `getProductDetail` sur un produit conforme avec `stock` 1 puis 0 renvoie un succès avec `inStock` `true` puis `false`
- [x] stock T6 passe : `getProductListPage` sur « Mug » (`stock` 12) et « Tasse » (`stock` 0) renvoie un succès avec `inStock` `true` puis `false`
- [x] stock T7 passe : `getProductListPage` sur un produit `stock` `-1`, puis `getProductDetail` sur un produit `stock` `null`, renvoient `{ ok: false, error: { code: "INVALID_BACKEND_RESPONSE", status: 502 } }` sans lever
- [x] stock T17 passe : `getProductListPage` sur deux produits sans `stock` et `getProductDetail` sur un produit sans `stock` réussissent, noms et prix présents, `inStock` `undefined` pour chacun
- [x] Les tests préexistants de ces cinq fichiers passent avec leurs fixtures et attendus d'origine (dont « T4 » de `product-detail.test.ts` qui compare la fiche par `toEqual`)
- [x] `harness gate arch --rule next-model-pure` et `harness gate arch --rule next-no-amount-arithmetic` sortent en 0
- [x] `pnpm typecheck`, `pnpm lint` et `pnpm test` sortent en 0

### Étape 2 : `StockStatus` affiché dans la liste et sur la fiche (traductions, composants)

**Fichiers** :
- `src/features/catalog/messages/fr.json` : `inStock` « En stock », `outOfStock` « Rupture de stock »
- `src/features/catalog/messages/en.json` : `inStock` « In stock », `outOfStock` « Out of stock »
- `src/features/catalog/components/stock-status.tsx` (nouveau) : Server
  Component synchrone `StockStatus({ inStock }: { inStock?: boolean })`,
  `<span>` avec `t("inStock")` / `t("outOfStock")` (`useTranslations("catalog")`),
  `null` si `inStock` est `undefined` ; ni `"use client"` ni couleur
- `src/features/catalog/components/stock-status.test.tsx` (nouveau)
- `src/features/catalog/components/product-list.tsx` : `<StockStatus inStock={item.inStock} />` après le prix de chaque `<li>`
- `src/features/catalog/components/product-detail-view.tsx` : `<StockStatus inStock={product.inStock} />` après le `<p>` du prix
- Tests : `components/product-list.test.tsx`, `components/product-detail-view.test.tsx` (nouveaux cas ajoutés, cas existants inchangés)
- `src/features/catalog/index.ts` : inchangé (aucune page n'importe `StockStatus`)

**Critères de succès** :
- [x] stock T8 passe : `StockStatus` en `fr` (vrais fichiers de messages) affiche « En stock » pour `inStock` `true`, « Rupture de stock » pour `false`
- [x] stock T9 passe : en `en`, « In stock » puis « Out of stock »
- [x] stock T18 passe : `StockStatus` en `fr` avec `inStock` `undefined` produit un rendu vide (`container` sans texte), sans « En stock », « Rupture de stock » ni `role="alert"`
- [x] stock T10 passe : `ProductList` en `fr` avec « Mug » (`inStock` `true`) et « Tasse » (`inStock` `false`) : le `listitem` de « Mug » contient « En stock » ; celui de « Tasse » contient « Rupture de stock », le lien « Tasse » vers `/fr/products/<id>` et son prix
- [x] stock T11 passe : `ProductDetailView` affiche « En stock » en `fr` (`inStock` `true`), puis en `en` (`inStock` `false`) « Out of stock », le nom, le prix `€1,234.50` (espaces insécables normalisés) et un seul `heading` de niveau 1
- [x] stock T12 passe : `ProductList` et `ProductDetailView` rendus avec un produit de modèle construit depuis `stock` 42 (via le mapper, fixtures sans « 42 » dans l'id, le nom ni le prix) n'affichent pas le texte « 42 »
- [x] stock T19 passe : `ProductList` avec deux produits sans `inStock`, puis `ProductDetailView` avec « Mug » sans `inStock`, en `fr` : noms (liens) et prix présents, un seul `h1` sur la fiche, ni « En stock » ni « Rupture de stock », aucun `role="alert"`
- [x] Les tests préexistants de `product-list.test.tsx` et `product-detail-view.test.tsx` passent avec leurs fixtures et attendus d'origine
- [x] stock T13 : `pnpm lint:architecture` sort en 0 (parité des clés fr/en)
- [x] stock T14 : `harness gate arch --rule next-model-pure`, `harness gate arch --rule next-index-client-safe` et `harness gate arch --rule next-no-fetch-outside-api` sortent en 0
- [x] stock T15 : `harness gate arch --rule next-no-cross-feature`, `harness gate arch --rule next-app-feature-public-api-only`, `harness gate arch --rule next-no-use-client-on-routes` et `harness gate arch --rule next-no-dangerous-html` sortent en 0
- [x] stock T16 : `pnpm typecheck`, `pnpm lint`, `pnpm test` et `pnpm build` sortent en 0
