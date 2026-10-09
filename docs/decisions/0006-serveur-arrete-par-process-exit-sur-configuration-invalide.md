# ADR 0006 : Serveur arrêté par process.exit(1) sur configuration invalide

- **Statut** : Acceptée
- **Date** : 2026-10-09
- **Décideurs** : rolandrm
- **Liée à** : `docs/specs/container-image.md` (US-003, T3), `docs/exec-plans/completed/container-image.md` (étape 3), `src/instrumentation.ts`, ADR 0002

## Contexte

L'ADR 0002 fait valider la configuration serveur au démarrage, dans
`register()` de `src/instrumentation.ts`. `register()` levait une erreur quand
`BACKEND_API_URL` manquait. La première exécution de l'image de production
(`harness tool image-check --requires-env`) a montré que le serveur
standalone de Next.js restait en marche malgré cette erreur : un conteneur
mal configuré aurait paru sain et échoué au premier appel au backend.

## Options envisagées

1. **Lever l'erreur dans `register()`** (état précédent) : simple, testé en
   unitaire, mais sans effet sur le serveur de production.
2. **Journaliser puis `process.exit(1)` dans `register()`** : le processus
   s'arrête, l'orchestrateur voit l'échec ; `process.exit` est simulé dans
   les tests.
3. **Script de démarrage qui valide avant de lancer `server.js`** : arrêt
   garanti, mais un second point d'entrée à maintenir hors de Next.js.

## Décision

Option 2 : en runtime Node, un échec de `getServerEnv()` écrit une ligne JSON
sur stderr (`level`, `msg`, noms des variables en cause, jamais leurs
valeurs), puis `process.exit(1)`. Elle garde un seul point de validation
(ADR 0002) et rend le refus réel. La ligne est écrite directement, sans
module de journalisation : le choix d'une bibliothèque (pino) est une
feature à part.

## Conséquences

- Un conteneur sans configuration valide s'arrête avec le code 1 et nomme la
  variable ; `harness tool image-check --requires-env` le prouve (T3).
- Interdit : une valeur de configuration dans un journal ; un test vérifie
  qu'une valeur invalide n'apparaît pas.
- Quand une bibliothèque de journalisation sera adoptée, cette ligne passera
  par elle, au niveau `fatal`, avant `process.exit(1)`.
