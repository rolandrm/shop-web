# ADR 0003 : Traductions des features assemblées dans `app/`

- **Statut** : Acceptée
- **Date** : 2026-10-05
- **Décideurs** : rolandrm
- **Liée à** : `docs/specs/catalog-products-list.md` (révision 1, question 1), `src/shared/i18n/`, `src/app/_i18n/request.ts`

## Contexte

Chaque feature garde ses textes dans `src/features/<feature>/messages/`. Le
socle chargeait les messages dans `src/shared/i18n/request.ts`. Pour y
ajouter ceux de la feature `catalog`, `shared/` aurait dû importer une
feature, ce que l'invariant `next-shared-knows-nothing` et la règle
`shared-knows-nothing` de dependency-cruiser interdisent : `shared/` ne connaît
aucune feature.

## Options envisagées

1. **Toutes les traductions dans `messages/` à la racine** : simple, mais une
   feature ne possède plus ses textes ; les fichiers grossissent avec chaque
   feature et deviennent un point de conflit.
2. **Désactiver la règle pour `shared/i18n`** : contourne une frontière
   d'architecture pour un cas qui se répètera.
3. **Fabrique générique dans `shared/`, assemblage dans `app/`** :
   `createRequestConfig(loadFeatureMessages)` dans `shared/i18n` n'importe
   aucune feature ; chaque feature expose son chargeur dans `index.ts` ;
   `src/app/_i18n/request.ts`, point d'entrée de next-intl, les assemble.

## Décision

Option 3 : `app/` est la seule couche qui connaît toutes les features, c'est
donc elle qui assemble leurs traductions.

## Conséquences

- Une nouvelle feature ajoute son chargeur dans `src/app/_i18n/request.ts`,
  sans toucher `shared/`.
- `next.config.ts` pointe next-intl vers `src/app/_i18n/request.ts`.
- La parité des clés entre langues reste vérifiée par
  `pnpm lint:architecture`, messages des features compris.
- Devenu la convention de Harness pour tout projet Next.js (Harness 0.5.4).
