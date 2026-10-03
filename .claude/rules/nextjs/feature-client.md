---
paths:
  - "src/features/*/components/**/*.tsx"
  - "src/features/*/hooks/**/*.ts"
  - "src/features/*/hooks/**/*.tsx"
---

# Composants, hooks et formulaires d'une feature

- Server Component par défaut ; `"use client"` le plus bas possible (état, effet, événement, API navigateur)
- Props serveur → client minimales et sérialisables (tout part dans le HTML)
- Présentation (données de vue + callbacks) séparée du conteneur ; un composant exporté par fichier, ~150 lignes max
- Clés TanStack Query UNIQUEMENT via la fabrique `hooks/keys.ts` ; jamais de tableau écrit à la main
- `queryFn` via `bffGet` sur `app/api/bff/**`, réponse revalidée par le même schéma Zod
- Mutation hors formulaire : `useMutation` → Server Action → invalidation des clés
- Formulaires : React Hook Form + résolveur Zod + `Form` shadcn ; MÊME schéma que l'action ; erreurs de champ via `setError` ; message traduit depuis `error.code`
- Bouton de soumission désactivé pendant l'envoi ; `Idempotency-Key` généré une fois par intention de soumission
- Montants saisis en chaîne (`z.string().regex(...)`), jamais `z.number()`
- État d'URL (filtres, tri, pagination, onglets) via `nuqs` ; aucun store global
