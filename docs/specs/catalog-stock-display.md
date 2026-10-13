# Spec : catalog-stock-display

- **Statut** : Implemented
- **Auteur** : Claude (à relire par l'équipe)
- **Version** : 0.1.0
- **Liée à** : `docs/specs/catalog-products-list.md` (feature `catalog`, `ProductList`, schéma de la liste, handlers MSW) ; `docs/specs/catalog-product-detail.md` (`ProductDetailView`, schéma du détail) ; `docs/specs/web-foundation.md` (socle : `backendRequest`, `Result`, i18n) ; règles `.claude/rules/nextjs/` (features, feature-server, model-schemas, i18n, ui, testing) ; contrat `docs/api/backends/shop-api.openapi.json` (shop-api v1.2.1, commit `5fb52c8`), opérations `CatalogController_listProducts_v1` et `CatalogController_getProduct_v1`
- **Révisions** : aucune

> **Choix à relire avant d'approuver.** Ils découlent du contrat de shop-api
> et des règles de la stack ; modifiez-les ici si besoin.
>
> | Choix                       | Valeur proposée                                                                                                                                                                  |
> | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | Règle de disponibilité      | `stock > 0` : « En stock » ; `stock = 0` : « Rupture de stock ». Le contrat garantit un entier de 0 à 2147483647, jamais `null`                                                  |
> | Quantité                    | Jamais affichée : seul l'état (en stock / rupture) l'est. Pas de seuil « stock faible »                                                                                          |
> | Textes                      | fr : « En stock » / « Rupture de stock » ; en : « In stock » / « Out of stock »                                                                                                  |
> | Présentation                | Texte seul, placé après le prix ; l'état n'est jamais porté par la couleur seule. Pas de style de couleur dans cette spec (pas d'outillage de design dans le socle)               |
> | Champ absent               | `stock` absent (shop-api antérieur à 1.2.0) : aucun état de stock affiché, le reste de la liste et de la fiche fonctionne normalement. On n'invente rien. Le schéma Zod rend `stock` optionnel, bien que le contrat v1.2.1 le déclare obligatoire : choix délibéré pour que shop-web et shop-api se déploient dans n'importe quel ordre |
> | Champ présent mais invalide | `stock` négatif, décimal, textuel, `null` ou supérieur à 2147483647 : réponse non conforme (`INVALID_BACKEND_RESPONSE`, 502), comme pour les autres champs |
> | Champ présent mais invalide | `stock` négatif, décimal, textuel, `null` ou supérieur à 2147483647 : réponse non conforme (`INVALID_BACKEND_RESPONSE`, 502), comme pour les autres champs |
> | Produit en rupture          | Reste affiché, lisible et cliquable dans la liste ; aucun filtre ni tri par disponibilité                                                                                        |
> | Composant                   | Un composant partagé `StockStatus`, utilisé par la liste et la fiche, pour que les deux pages disent la même chose                                                               |

## Contexte

Les specs `catalog-products-list` et `catalog-product-detail` excluaient le
stock parce que le contrat n'en parlait pas. Depuis shop-api v1.2.1, la copie
du contrat commitée expose `stock` (entier, `0` = rupture, jamais `null`) sur
chaque produit de la liste et sur la fiche. Cette feature utilise ce champ
pour dire au visiteur si un produit est disponible, dans la liste et sur la
fiche, sans afficher la quantité. Le champ est lu de façon tolérante : absent,
rien n'est affiché, ce qui permet de déployer shop-web et shop-api, et de
revenir en arrière sur l'un ou l'autre, indépendamment.

## Périmètre

**Inclus** :

- Extension de la feature `src/features/catalog/` (pas de nouvelle feature) :
  - `schemas/products.ts` : le schéma de produit partagé par la liste et le détail gagne `stock: z.number().int().min(0).max(2147483647).optional()` (champ optionnel : absent accepté, `null` refusé)
  - `model/products.ts` : fonction pure `isInStock(stock: number): boolean` (`stock > 0`) ; les types `ProductListItem` et `ProductDetail` gagnent `inStock?: boolean` (`undefined` quand le backend n'a pas envoyé `stock`)
  - `server/mappers.ts` : `toProductListPage` et `toProductDetail` renseignent `inStock` par `isInStock(item.stock)` quand `stock` est présent, et le laissent `undefined` sinon ; la quantité n'est pas transmise aux composants
  - `components/stock-status.tsx` : Server Component synchrone `StockStatus({ inStock })` avec `inStock?: boolean`, rend un `<span>` portant le texte traduit `catalog.inStock` ou `catalog.outOfStock`, et ne rend rien (`null`) quand `inStock` est `undefined` ; aucun `"use client"`
  - `components/product-list.tsx` : chaque produit affiche `StockStatus` après son prix
  - `components/product-detail-view.tsx` : la fiche affiche `StockStatus` après le prix
  - `index.ts` : réexporte `StockStatus` seulement si une page l'importe ; sinon rien de plus (les types `ProductListItem` et `ProductDetail` sont déjà exportés)
  - `messages/fr.json` et `messages/en.json` : clés `catalog.inStock` et `catalog.outOfStock`, mêmes clés dans les deux langues
  - `__mocks__/handlers.ts` : le type `MockProduct` gagne `stock` ; `makeProducts` renvoie `stock: 5` par défaut, surchargeable produit par produit ; un handler renvoyant des produits sans `stock` est ajouté pour le cas d'un shop-api antérieur à 1.2.0
  - Les fixtures des tests existants, qui n'envoient pas `stock`, restent valables sans modification (champ optionnel)

**Exclus** :

- Affichage de la quantité exacte, seuil « stock faible », message « plus que N en stock »
- Filtre, tri ou masquage des produits par disponibilité
- Désactivation ou masquage d'un bouton d'achat (il n'existe pas de panier)
- Rafraîchissement du stock en direct (polling, WebSocket) : la valeur est celle lue au rendu de la page
- Style de couleur ou icône pour l'état
- TanStack Query, route BFF `app/api/bff/**`, `nuqs`, composants shadcn/ui
- Tests de bout en bout (Playwright, Prism, axe) : reportés à la spec qui introduira l'outillage E2E
- Mise à jour de la copie du contrat `docs/api/backends/shop-api.openapi.json` (déjà en v1.2.1)
- Modification des specs `catalog-products-list` et `catalog-product-detail` (statut `Implemented`) : leurs mentions « stock exclu » sont remplacées par la présente spec

## User stories

### US-001 — Voir la disponibilité dans la liste

**En tant que** visiteur **je veux** voir pour chaque produit de la liste s'il est en stock **afin de** ne pas ouvrir la fiche d'un produit indisponible

```gherkin
Given un backend qui renvoie, pour GET /v1/products, deux produits : "Mug" avec "stock":12 et "Tasse" avec "stock":0
When je demande /fr/products
Then la ligne de "Mug" affiche le texte "En stock"
And la ligne de "Tasse" affiche le texte "Rupture de stock"
And la ligne de "Tasse" affiche toujours son nom comme lien vers sa fiche et son prix

Given le même backend
When je demande /en/products
Then la ligne de "Mug" affiche "In stock" et la ligne de "Tasse" affiche "Out of stock"
```

### US-002 — Voir la disponibilité sur la fiche produit

**En tant que** visiteur **je veux** voir sur la fiche d'un produit s'il est en stock **afin de** savoir si je peux l'obtenir

```gherkin
Given un backend qui renvoie pour GET /v1/products/00000000-0000-4000-8000-000000000001 {"id":"00000000-0000-4000-8000-000000000001","name":"Mug","price":{"amount":"1234.50","currency":"EUR"},"stock":1}
When je demande /fr/products/00000000-0000-4000-8000-000000000001
Then la page affiche le texte "En stock" après le prix
And la page n'affiche pas la valeur "1" comme quantité

Given le même produit avec "stock":0
When je demande /en/products/00000000-0000-4000-8000-000000000001
Then la page affiche le texte "Out of stock"
And le nom "Mug" et le prix "€1,234.50" restent affichés
```

### US-003 — Backend sans information de stock

**En tant que** visiteur **je veux** que le catalogue reste utilisable quand le backend n'envoie pas le stock **afin de** ne pas perdre la liste ni les fiches

```gherkin
Given un backend qui renvoie pour GET /v1/products deux produits "Mug" et "Tasse" sans champ "stock"
When je demande /fr/products
Then la page affiche les noms "Mug" et "Tasse" comme liens vers leurs fiches, avec leurs prix
And aucun texte "En stock" ni "Rupture de stock" n'est affiché
And aucun élément role="alert" n'est affiché

Given un backend qui renvoie pour GET /v1/products/00000000-0000-4000-8000-000000000001 {"id":"00000000-0000-4000-8000-000000000001","name":"Mug","price":{"amount":"1234.50","currency":"EUR"}} sans champ "stock"
When je demande /en/products/00000000-0000-4000-8000-000000000001
Then la page affiche un seul titre h1 contenant "Mug" et le prix "€1,234.50"
And aucun texte "In stock" ni "Out of stock" n'est affiché
And aucun élément role="alert" n'est affiché
```

### US-004 — Stock invalide

**En tant que** visiteur **je veux** un message d'erreur plutôt qu'un état de stock faux **afin de** ne pas être induit en erreur

```gherkin
Given un backend qui renvoie pour GET /v1/products un produit avec "stock":-1
When je demande /fr/products
Then la page affiche dans un élément role="alert" le message errors.generic
And aucun texte "En stock" ni "Rupture de stock" n'est affiché

Given un backend qui renvoie pour GET /v1/products/00000000-0000-4000-8000-000000000001 un produit avec "stock":2.5, ou "stock":null, ou "stock":"3"
When je demande /fr/products/00000000-0000-4000-8000-000000000001
Then la page affiche dans un élément role="alert" le message errors.generic
And aucun texte "En stock" ni "Rupture de stock" n'est affiché
```

## Contrat d'API

### Exposé par l'application

Aucune nouvelle route ni nouveau paramètre : les pages `GET /[locale]/products` et `GET /[locale]/products/{id}` affichent en plus l'état du stock.

### Consommé : shop-api `GET /v1/products` et `GET /v1/products/{id}`

Requêtes inchangées. Réponses `200`, champs validés par le schéma Zod (les autres champs éventuels sont ignorés). Seul `stock` s'ajoute à ce que valident les specs précédentes. Il figure déjà, obligatoire, dans la copie du contrat (shop-api v1.2.1) pour les éléments de `items` de la liste et pour la fiche ; le schéma Zod de shop-web le rend **optionnel** (écart voulu avec le contrat, pour tolérer un shop-api antérieur à 1.2.0). Schéma validé, `stock` absent de `required` :

```json
{
  "type": "object",
  "required": ["id", "name", "price"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string", "minLength": 1, "maxLength": 200 },
    "price": {
      "type": "object",
      "required": ["amount", "currency"],
      "properties": {
        "amount": { "type": "string", "pattern": "^\\d+\\.\\d{2}$" },
        "currency": { "enum": ["EUR", "USD", "GBP"] }
      }
    },
    "stock": {
      "type": "integer",
      "minimum": 0,
      "maximum": 2147483647,
      "description": "Nombre d'unités disponibles à la vente au moment de la lecture. 0 = rupture. Jamais null."
    }
  }
}
```

Réponses d'erreur du backend : inchangées (`400`, `404`, `500`, forme commune du socle). Erreurs retournées par les queries aux pages : inchangées ; un `stock` présent mais hors schéma (négatif, décimal, textuel, `null`, supérieur à 2147483647) tombe dans la ligne « Corps `200` non conforme au schéma » : `code` `INVALID_BACKEND_RESPONSE`, `status` 502, rendu par `ProductListError` (liste) ou `ProductDetailError` (fiche), qui affichent `errors.generic`.

Règle de présentation (`model/products.ts`) :

| `stock` reçu         | `inStock` | Texte fr          | Texte en     |
| -------------------- | --------- | ----------------- | ------------ |
| absent               | `undefined` | aucun texte     | aucun texte  |
| `0`                  | `false`   | Rupture de stock  | Out of stock |
| `1` à `2147483647`   | `true`    | En stock          | In stock     |

## Contraintes non fonctionnelles

- Latence : aucun appel supplémentaire ; `stock` est lu dans les réponses déjà demandées ; la fiche garde un seul appel backend par affichage (`cache()` de React inchangé)
- Poids client : aucun `"use client"` ajouté dans `src/features/catalog/` ni dans `src/app/` ; les pages fonctionnent sans JavaScript
- Sécurité : le texte affiché vient des fichiers de traduction, jamais d'une valeur du backend ; aucun `dangerouslySetInnerHTML` ; la quantité exacte n'est pas transmise aux composants (seul `inStock` l'est)
- Accessibilité (WCAG 2.2 AA) : l'état est du texte lisible, jamais porté par la couleur seule
- Coût : aucun service ni dépendance ajouté
- Dépendances : aucune nouvelle ; le plan de test utilise `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw` et `next-intl` (`NextIntlClientProvider` avec les vrais fichiers de traduction), déjà présents dans `package.json`

## Plan de test

| Id  | Niveau            | Scénario                                                                                                                                                  | Attendu                                                                                                                                                                         | Couvre                 |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| T1  | unit              | Schéma de réponse de la liste, puis schéma de réponse du détail, sur un produit avec `stock` 0, 12 et 2147483647, puis sur un produit sans `stock`                                          | les quatre cas sont acceptés dans les deux schémas                                                                                                                              | US-001, US-002, US-003 |
| T2  | unit              | Les deux mêmes schémas sur un produit avec `stock` `-1`, `2.5`, `null`, `"3"` et `2147483648`                                                             | les cinq cas sont refusés dans les deux schémas                                                                                                                                 | US-004                 |
| T3  | unit              | `isInStock` avec `0`, `1`, `2147483647`                                                                                                                   | `false`, `true`, `true`                                                                                                                                                         | US-001, US-002         |
| T4  | unit              | Mappers liste et détail sur des produits avec `stock` 12, puis 0, puis sans `stock`                                                                       | `inStock` vaut `true`, `false`, puis `undefined` ; l'objet produit ne contient pas de clé `stock`                                                                               | US-001, US-002, US-003 |
| T5  | intégration (MSW) | `getProductDetail` sur un produit conforme avec `stock` 1, puis avec `stock` 0                                                                            | succès avec `inStock` `true`, puis succès avec `inStock` `false`                                                                                                                | US-002                 |
| T6  | intégration (MSW) | La query de la liste sur deux produits `stock` 12 et 0                                                                                                    | succès ; `inStock` vaut `true` pour le premier, `false` pour le second                                                                                                          | US-001                 |
| T7  | intégration (MSW) | La query de la liste sur un produit avec `stock` `-1`, puis `getProductDetail` sur un produit avec `stock` `null`                                         | erreurs `INVALID_BACKEND_RESPONSE` / 502 dans les deux cas ; aucune exception levée                                                                                             | US-004                 |
| T8  | composant         | `StockStatus` rendu en `fr` avec `inStock` `true`, puis `false`, messages chargés depuis les vrais fichiers                                               | textes de `catalog.inStock` puis `catalog.outOfStock` de `src/features/catalog/messages/fr.json` ("En stock", "Rupture de stock")                                               | US-001, US-002         |
| T9  | composant         | `StockStatus` rendu en `en` avec `inStock` `true`, puis `false`                                                                                           | "In stock" puis "Out of stock" (textes de `messages/en.json`)                                                                                                                   | US-001, US-002         |
| T10 | composant         | `ProductList` rendu en `fr` avec « Mug » (`inStock` `true`) et « Tasse » (`inStock` `false`)                                                              | dans le `listitem` de « Mug » : texte "En stock" ; dans celui de « Tasse » : "Rupture de stock", le lien vers sa fiche et son prix                                              | US-001                 |
| T11 | composant         | `ProductDetailView` rendu en `fr` avec « Mug » `inStock` `true`, puis en `en` avec `inStock` `false`                                                      | "En stock" présent ; puis "Out of stock" présent, avec le nom et le prix `€1,234.50` (espaces insécables normalisés) ; un seul `heading` de niveau 1                            | US-002                 |
| T12 | composant         | `ProductDetailView` et `ProductList` rendus avec un produit de `stock` 42                                                                                 | le texte "42" n'apparaît pas dans le rendu (la quantité n'est pas affichée)                                                                                                     | US-002                 |
| T13 | structure         | Parité des traductions, dont `src/features/catalog/messages/`                                                                                             | `pnpm lint:architecture` sort en 0                                                                                                                                              | US-001, US-002         |
| T14 | structure         | `model/` pur ; `index.ts` client-safe ; aucun `fetch` hors `shared/api`                                                                                   | `harness gate arch --rule next-model-pure`, `harness gate arch --rule next-index-client-safe` et `harness gate arch --rule next-no-fetch-outside-api` sortent en 0              | US-001, US-002         |
| T15 | structure         | Aucune feature n'en importe une autre ; `app/` n'importe que l'API publique de `catalog` ; aucun `"use client"` sur une page ; aucun `dangerouslySetInnerHTML` | `harness gate arch --rule next-no-cross-feature`, `harness gate arch --rule next-app-feature-public-api-only`, `harness gate arch --rule next-no-use-client-on-routes` et `harness gate arch --rule next-no-dangerous-html` sortent en 0 | US-001, US-002 |
| T16 | structure         | Typage, lint et build, tests existants inchangés                                                                                                          | `pnpm lint`, `pnpm typecheck`, `pnpm test` et `pnpm build` sortent en 0                                                                                                         | US-001, US-002, US-003, US-004 |
| T17 | intégration (MSW) | La query de la liste sur deux produits sans `stock`, puis `getProductDetail` sur un produit sans `stock`                                                  | trois succès, sans erreur ; noms et prix présents ; `inStock` vaut `undefined` pour chacun                                                                                      | US-003                 |
| T18 | composant         | `StockStatus` rendu en `fr` avec `inStock` `undefined`                                                                                                    | le rendu est vide : ni "En stock", ni "Rupture de stock", aucun élément `role="alert"`                                                                                          | US-003                 |
| T19 | composant         | `ProductList` avec deux produits sans `inStock`, puis `ProductDetailView` avec « Mug » sans `inStock`, rendus en `fr`                                     | noms (liens vers les fiches) et prix présents, un seul `heading` de niveau 1 sur la fiche ; aucun texte "En stock" ni "Rupture de stock" ; aucun `role="alert"`                 | US-003                 |

Les Server Components asynchrones (`page.tsx`) sont couverts par leurs
queries (T5 à T7, T17) et par les composants synchrones qu'ils composent (T8
à T12, T18, T19), conformément à la règle `testing`.

## Risques

- **Écart volontaire avec le contrat** : le contrat v1.2.1 déclare `stock` obligatoire, le schéma Zod le déclare optionnel, pour que shop-web et shop-api se déploient et reviennent en arrière indépendamment. Conséquence : si shop-api cessait d'envoyer `stock` par erreur, aucune erreur ne le signale, les états disparaissent des pages en silence. La vérification après déploiement contrôle leur présence. Une fois shop-api ≥ 1.2.0 déployé partout, rendre `stock` obligatoire est une spec de resserrement à part
- **Corps `stock` de forme inattendue** : seul `undefined` est toléré ; `null`, texte, négatif, décimal ou trop grand font échouer le schéma et affichent `errors.generic` sur toute la liste ou la fiche, pas seulement sur le produit concerné (le schéma valide la réponse entière)
- **Stock lu au rendu** : la valeur peut changer entre l'affichage et la lecture suivante ; « En stock » est une information indicative, pas une réservation. Aucun cache Next.js (`cache: "no-store"` du socle), donc la valeur est celle du dernier chargement de la page
- **Évolution du contrat** : si shop-api renomme `stock` ou change sa sémantique (par exemple `null` pour « illimité »), le schéma échoue et l'erreur est visible dans les journaux ; la copie du contrat ne bouge que par un geste humain, relu en PR
- **Lisibilité de la liste** : une ligne à trois éléments (nom, prix, état) peut passer à la ligne sur petit écran ; sans régression de contenu, la mise en page fine est hors périmètre
- **Textes en dur** : la règle `i18n` interdit les textes en dur ; `pnpm lint` et T13 le détectent

## Déploiement et retour arrière

- **Ordre de mise en place** : aucun ordre imposé entre shop-web et shop-api. Aucune nouvelle variable d'environnement (`BACKEND_API_URL` existe déjà), aucune migration
- **Compatibilité** : shop-web fonctionne avec un shop-api qui envoie `stock` (état affiché) comme avec un shop-api antérieur à 1.2.0 qui ne l'envoie pas (aucun état affiché, reste de la page inchangé). La version précédente de shop-web ignore les champs inconnus de shop-api, donc fonctionne avec les deux aussi
- **Retour arrière** : shop-web et shop-api reviennent en arrière chacun seul, dans n'importe quel ordre ; rien n'est perdu (aucune donnée écrite). Retour arrière de shop-web : les pages perdent l'état de stock et restent fonctionnelles. Retour arrière de shop-api sous 1.2.0 : les pages perdent l'état de stock et restent fonctionnelles
- **Vérification après déploiement** : avec un shop-api ≥ 1.2.0, sur `/fr/products`, chaque produit affiche « En stock » ou « Rupture de stock » (leur absence pour tous les produits signale un `stock` non envoyé) ; un produit dont la réponse backend porte `"stock":0` affiche « Rupture de stock », un produit à stock positif affiche « En stock », et la quantité n'apparaît nulle part ; la fiche du même produit affiche le même état que la liste ; `/en/products` affiche « In stock » / « Out of stock » ; `GET /api/health` renvoie toujours 200
