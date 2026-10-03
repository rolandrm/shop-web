---
paths:
  - "src/features/*/server/**/*.ts"
  - "src/features/*/server.ts"
---

# Code serveur d'une feature (gateway, queries, actions)

- Premier import : `import 'server-only'`
- `server/gateway.ts` : méthodes métier au-dessus de `backendRequest` (`shared/api`) ; aucun autre `fetch` vers le backend
- Toute réponse backend parsée par un schéma Zod ; gateways et queries retournent `Result`
- `server/mappers.ts` : réponse backend → modèle de vue ; `server/queries.ts` : lecture pour le rendu
- `server/actions.ts` (`"use server"`) : mutations uniquement, jamais de lecture
- Server Action : entrée typée `unknown` → `safeParse` Zod → `requireSession()` à CHAQUE appel → gateway → `ActionResult` → invalidation explicite (`revalidatePath` / `revalidateTag`)
- Échecs attendus RETOURNÉS (`ActionResult`), jamais levés
- `Idempotency-Key` reçu du client, relayé au backend
