---
paths:
  - "middleware.ts"
  - "proxy.ts"
  - "next.config.ts"
  - "instrumentation.ts"
  - "src/shared/auth/**/*.ts"
  - "src/shared/config/**/*.ts"
---

# Session BFF, sécurité et configuration

- Jetons en cookies `httpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, préfixe `__Host-` en production
- Connexion / déconnexion par Server Action ; le navigateur ne voit jamais les jetons
- Rafraîchissement dans le middleware uniquement ; garde dans le middleware ET dans le layout `(app)`, chaque Server Action, chaque Route Handler
- Paramètre `next` : chemin interne uniquement (commence par `/`, pas `//`)
- `X-Request-Id` généré ou repris dans le middleware
- `next.config.ts` : `output: 'standalone'` (sauf hébergement managé), `poweredByHeader: false`, `reactStrictMode: true`, en-têtes CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` ; pas de `unsafe-eval` en production
- Variables validées au démarrage du serveur : `register()` de `src/instrumentation.ts` appelle `getServerEnv()` (runtime Node) ; la construction (`pnpm build`) n'en lit aucune et passe sans `.env` : une même image se déploie dans chaque environnement ; `NEXT_PUBLIC_*` = public, figé au build : jamais de secret ni l'URL du backend
- `.env.example` sans valeurs réelles ; aucun `.env` commité
- OpenTelemetry via `instrumentation.ts`
