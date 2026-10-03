---
paths:
  - "src/features/**/*.ts"
  - "src/features/**/*.tsx"
---

# Features — isolation

- Une feature n'importe JAMAIS une autre feature
- Deux surfaces publiques : `index.ts` (client-safe, ne réexporte jamais du serveur) et `server.ts` (commence par `import 'server-only'`)
- `components/` UI, `hooks/` TanStack Query (client), `server/` interne serveur, `schemas/` Zod, `model/` TS pur, `messages/` traductions, `__mocks__/` handlers MSW
- `model/` : types de vue + fonctions pures, sans React, Next ni TanStack
- `hooks/` ne touche jamais `server/`, `shared/api/backend-client`, `shared/auth`, `shared/config/env.server`
- Messages : namespace = nom de la feature ; la feature n'utilise que son namespace, `common` et `errors`
