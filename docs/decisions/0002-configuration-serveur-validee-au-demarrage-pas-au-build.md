# ADR 0002 : Configuration serveur validée au démarrage, pas au build

- **Statut** : Proposée
- **Date** : 2026-10-05
- **Décideurs** : rolandrm
- **Liée à** : `docs/specs/web-foundation.md` (US-003), `docs/exec-plans/completed/catalog-products-list.md` (révision 1, étape 5), `src/shared/config/env.server.ts`, `src/instrumentation.ts`

## Contexte

Le socle validait `BACKEND_API_URL` au chargement du module
`env.server.ts`. Tant qu'aucune page n'appelait le backend, rien ne le
chargeait pendant le build. La première page qui l'a fait
(`/[locale]/products`) a rendu le build dépendant de la variable : Next.js
charge les pages pour les analyser pendant `pnpm build`, et le build échouait
sans `.env`, en local comme en CI.

## Options envisagées

1. **Fournir la variable au build** (valeur factice en CI) : rapide, mais la
   construction dépend de la configuration d'exécution ; une image ne peut
   plus être construite une fois puis déployée dans chaque environnement, et
   chaque équipe refait le bricolage dans sa CI.
2. **Lire la variable au premier appel au backend** : le build passe, mais une
   configuration manquante n'est découverte qu'au premier visiteur, contraire
   à US-003 (« refuser de démarrer »).
3. **Lire à la demande, valider au démarrage du serveur** : `getServerEnv()`
   valide au premier appel puis mémorise ; `register()` de
   `src/instrumentation.ts` l'appelle au démarrage du serveur (runtime Node).

## Décision

Option 3 : le build ne lit aucune variable d'exécution, et le serveur refuse
toujours de démarrer sans configuration valide.

## Conséquences

- `pnpm build` passe sans `.env` ; `harness verify` le prouve (test « build
  sans `BACKEND_API_URL` »).
- Interdit : lire la configuration serveur au chargement d'un module.
- `NEXT_RUNTIME` est lu par `src/shared/config/runtime.ts`, seul autre
  `process.env` permis (invariant `next-no-process-env`).
- Devenu la convention de Harness pour tout projet Next.js (spec du socle et
  règles `shared`, `security`, Harness 0.5.4).
