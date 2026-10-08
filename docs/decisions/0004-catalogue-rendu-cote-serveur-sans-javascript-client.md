# ADR 0004 : Catalogue rendu côté serveur, sans JavaScript client

- **Statut** : Acceptée
- **Date** : 2026-10-05
- **Décideurs** : rolandrm
- **Liée à** : `docs/specs/catalog-products-list.md` (Contraintes non fonctionnelles), `docs/specs/catalog-product-detail.md`, `src/features/catalog/components/`

## Contexte

Le catalogue se filtre par devise et se pagine par curseur. Ces interactions
pouvaient se faire dans le navigateur (état client, requêtes au BFF) ou par de
simples liens dont la page serveur lit les paramètres.

## Options envisagées

1. **Composants client** (`"use client"`, TanStack Query, route BFF) : transitions
   plus fluides, mais du JavaScript envoyé au navigateur, une route BFF, une
   dépendance et un état à synchroniser avec l'adresse.
2. **Liens rendus par le serveur** : filtre et pagination sont des liens ; la
   page parse ses `searchParams` par Zod et appelle le backend ; rien ne
   s'exécute dans le navigateur.

## Décision

Option 2 pour la liste et la fiche produit : Server Components synchrones dans
`src/features/catalog/`, aucun `"use client"` hors des `error.tsx` (que
Next.js impose en composant client).

## Conséquences

- La page fonctionne sans JavaScript ; l'état (devise, page) vit dans
  l'adresse, partageable et compatible avec le bouton Précédent.
- Un paramètre d'adresse invalide est ignoré (page affichée comme s'il était
  absent) plutôt qu'une erreur.
- Une interaction qui exige du client (panier, recherche instantanée) sera une
  décision explicite, par une nouvelle ADR, pas une dérive composant par
  composant.
