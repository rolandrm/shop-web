---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "e2e/**/*.ts"
---

# Tests

- Vitest + Testing Library + MSW ; Playwright + `@axe-core/playwright` ; backend simulé par Prism (OpenAPI) en E2E ; jamais Jest
- Unitaire : `model/`, mappers, schémas, utilitaires
- Composants client : comportement visible (rôles, textes traduits), pas l'implémentation
- Serveur : gateways, queries, Server Actions avec MSW (Node) ; validation, mapping, format d'erreur commun
- Server Components asynchrones testés via leurs queries et en E2E, pas avec Testing Library
- Messages chargés depuis les vrais fichiers de traduction
- Handlers MSW par feature (`features/X/__mocks__/handlers.ts`) ; aucun appel réseau réel hors E2E
- Accessibilité : aucune violation axe sérieuse sur les pages clés
- Outillage (versions de la stack) : `vitest.config.mts` ; `server-only` aliasé vers son chemin complet (`node_modules/server-only/empty.js`, le chemin court est refusé par le paquet) ; MSW lancé avec « requête non gérée = erreur » sous le nom de la version installée (`onUnhandledRequest` en msw 2, `onUnhandledFrame` en msw 3), prouvé par un test qui échoue sur une requête sans handler
