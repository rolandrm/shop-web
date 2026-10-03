---
paths:
  - "src/shared/**/*.ts"
  - "src/shared/**/*.tsx"
---

# shared/ — transverse (≈ CoreKit + SharedUI)

- Ne connaît AUCUNE feature ni `app/`
- `ui/` : composants shadcn/ui possédés par le projet ; thème par variables CSS (tokens)
- `lib/` : `cn()`, `Result`, `ActionResult`, `formatMoney(amount: string, currency, locale)` sans conversion en `number`
- `api/backend-client.ts` (`server-only`) : seul `fetch` vers le backend ; `cache: "no-store"`, timeout, `Accept-Language`, `X-Request-Id`, `Idempotency-Key` ; erreur au format commun, réponse invalide → `502 INVALID_BACKEND_RESPONSE`
- `api/bff-route.ts` et client `bffGet` (navigateur) ; réponses BFF sans le champ `message`
- `auth/` (`server-only`) : `getSession()`, `requireSession()` ; ne rafraîchit jamais depuis un Server Component
- `config/` : `env.server.ts` (`server-only`) et `env.client.ts` (`NEXT_PUBLIC_*` uniquement) validés par Zod
- `providers/` : `QueryClient` créé une fois par requête serveur / par session client, jamais au niveau module
- `observability/` : `pino` (JSON, `requestId`, `traceId`), rapport d'erreurs ; jamais de données personnelles
