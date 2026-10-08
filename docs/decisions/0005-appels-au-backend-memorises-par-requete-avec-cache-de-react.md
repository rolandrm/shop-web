# ADR 0005 : Appels au backend mémorisés par requête avec `cache()` de React

- **Statut** : Acceptée
- **Date** : 2026-10-08
- **Décideurs** : rolandrm
- **Liée à** : `docs/specs/catalog-product-detail.md` (titre de l'onglet), `docs/exec-plans/completed/catalog-product-detail.md` (question 2), `src/features/catalog/server/queries.ts`

## Contexte

La fiche produit affiche le nom du produit dans la page et dans le titre de
l'onglet (`generateMetadata`). Next.js mémorise un `fetch` partagé entre les
deux, sauf quand il porte un `signal` d'annulation : c'est le cas de
`backendRequest`, qui impose un délai d'expiration par
`AbortSignal.timeout`. Sans autre mesure, chaque affichage appelait deux fois
le backend.

## Options envisagées

1. **Titre fixe (« Produit »)** : un seul appel, mais dix onglets portent le
   même nom et les moteurs de recherche indexent « Produit » partout.
2. **Retirer le délai d'expiration du `fetch`** : Next.js mémoriserait, mais
   une page attendrait indéfiniment un backend lent.
3. **`cache()` de React sur la query** : la fonction est mémorisée le temps
   d'une requête serveur ; titre et page partagent un seul appel.

## Décision

Option 3. La fonction mémorisée prend des arguments simples (chaînes), car
`cache()` compare ses arguments par identité : un objet `{ id, locale }` neuf à
chaque appel ne serait jamais retrouvé.

## Conséquences

- Un seul `GET /v1/products/{id}` par affichage d'une fiche ; à constater dans
  les journaux du backend (non prouvable sous Vitest : hors rendu serveur,
  `cache()` appelle la fonction à chaque fois).
- Convention pour toute query appelée à la fois par une page et par
  `generateMetadata` : la mémoriser par `cache()`, arguments primitifs.
