---
paths:
  - "src/app/**/*.ts"
  - "src/app/**/*.tsx"
---

# app/ — routing et composition (composition root)

- Seul endroit qui connaît toutes les features : importe UNIQUEMENT `features/X` (index) et `features/X/server`
- Pages et layouts fins : parser les `searchParams` (Zod), charger via `features/X/server`, composer, rendre ; aucun `fetch` direct
- Composition inter-features ici (`children`, props de type slot), jamais une feature qui en importe une autre
- Aucun `"use client"` sur `page.tsx`, `layout.tsx`, `template.tsx`
- Chaque segment qui charge des données a `loading.tsx` (ou `Suspense`) et `error.tsx` ; `global-error.tsx` en dernier recours
- Chargements indépendants en parallèle (`Promise.all`), jamais en cascade
- `404` → `notFound()` ; `401` → connexion avec retour ; `403` → accès refusé explicite
- Pages authentifiées dynamiques ; garde de session dans le layout `(app)`
- `app/api/bff/**` : `bffRoute(...)` (session + `Result` → HTTP) ; lectures en `GET` ; routes qui modifient réservées aux webhooks signés
- `app/api/health` ne dépend pas du backend
