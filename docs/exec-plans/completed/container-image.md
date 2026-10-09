# Plan d'exécution : container-image

- **Statut** : COMPLETED
- **Taille** : M
- **Durée attendue** : à mesurer (aucun cycle de cette taille sur ce poste : `.claude/state/cycle-times.json` absent)
- **Points d'arrêt** : après l'étape 3 (preuves humaines de l'image et du compose à l'étape 4, Docker refusé aux agents : T3 relancé, T2 et T4 déjà acquis) ; à l'étape 5 (modification de `harness.config.json` et régénération du workflow CI : règles 4 et 5, gestes humains)
  **Note** : l'humain approuve ce plan en tapant `/harness:ship docs/specs/container-image.md --continue` ; il passe `COMPLETED` sur preuve en fin de cycle (toutes les cases cochées, `harness verify` vert).

- **Spec** : `docs/specs/container-image.md` (Approved, v0.1.0)
- **Règles** : `.claude/rules/platform/` (general, dockerfile, compose, publishing, verification), `.claude/rules/nextjs/security.md` (`output: 'standalone'`, build sans variable d'exécution, variables validées au démarrage), `.claude/rules/nextjs/general.md` (aucun `console.*`, aucun `process.env` hors `shared/config`), `.claude/rules/nextjs/app-routes.md` (`app/api/health` sans backend). Le logger `pino` de `.claude/rules/nextjs/shared.md` (`observability/`) est hors de ce cycle (décision 9).
- **Révisions du plan** : 3
  1. Réponses de l'humain aux questions 1 à 6 reportées ; étape 1 : retrait des `ARG VERSION`/`ARG REVISION` et des étiquettes OCI `LABEL`, ajoutées par la CI générée par `harness ci` au moment de publier.
  2. T3 a montré que le serveur réel ne s'arrête pas quand la configuration manque : `register()` rejette, mais Next.js journalise l'erreur et le serveur reste en marche. Nouvelle étape 3 (arrêt du serveur réel sur configuration invalide, décision 8) insérée avant les preuves humaines ; anciennes étapes 3 et 4 renumérotées 4 et 5.
  3. Réponse de l'humain à la question 1 (décision 9) : pas de `pino` ni de module de journalisation ; une ligne écrite sur stderr directement dans `register()`, puis `process.exit(1)`. Étape 3 réduite à `src/instrumentation.ts` et son test ; point d'arrêt « avant l'étape 3 » (installation de `pino`) supprimé. Décision 10 : pas de `harness upgrade` pendant ce cycle, T3 se prouve avec `harness` v0.7.3 (mention de v0.7.4 retirée des critères et du point d'arrêt).

## Questions à l'humain

aucune

## Décisions de l'humain

1. **Image de base** : `node:22.23.3-alpine` (sortie de `harness tool image-version`), utilisée telle quelle dans chaque `FROM`.
2. **Compose sans base ni migration** : oui. Un seul service `web` ; la partie migrations de US-002/T4 est sans objet.
3. **Backend dans le compose** : oui. `BACKEND_API_URL: ${COMPOSE_BACKEND_API_URL:-http://host.docker.internal:8080}` avec `extra_hosts: ["host.docker.internal:host-gateway"]` ; pas de service shop-api ni Prism dans le compose.
4. **T2 (hadolint)** : oui, lancé par l'humain au point d'arrêt des preuves humaines (pas de déclaration dans `harness.config.json`).
5. **T5 (`harness tool release-check vX.Y.Z`)** : oui, hors plan, après fusion ; décrit dans `docs/runbooks/local.md` (section « Publier une version »).
6. **Sonde de santé** : oui, `GET /api/health` et son test inchangés.
7. **Étiquettes OCI** : pas d'`ARG VERSION`/`REVISION` ni de `LABEL` dans le `Dockerfile` ; la CI générée par `harness ci` les ajoute (`--label`) à la publication.
8. **Arrêt du serveur réel sans configuration** (après le premier passage de T3) : dans `register()` de `src/instrumentation.ts`, en runtime Node, si `getServerEnv()` échoue, journaliser l'erreur (nom de la variable, jamais sa valeur ; aucun `console.*`) puis `process.exit(1)` ; aucun `process.env` hors `shared/config` ; `src/instrumentation.test.ts` adapté avec `process.exit` simulé. Forme du journal : décision 9.
9. **Journal sans dépendance** (réponse à la question 1, option 2) : aucun module de journalisation (ni `src/shared/observability/logger.server.ts` ni son test), aucun `pnpm add`. `register()` écrit directement une seule ligne (JSON ou texte) par `process.stderr.write`, qui nomme les variables en cause sans jamais leurs valeurs, puis appelle `process.exit(1)`. `pino` fera l'objet d'une feature à part.
10. **Pas de `harness upgrade` pendant ce cycle** : avec `process.exit(1)`, le serveur s'arrête avec le code 1, ce que `harness tool image-check` v0.7.3 constate correctement (le défaut corrigé en v0.7.4 ne touchait que le cas d'un serveur resté en marche). T3 se prouve sans changer de version.

## Constat de départ (code lu)

- `src/app/api/health/route.ts` : `GET` renvoie `Response.json({ status: "ok" })`, sans dépendance ; test `route.test.ts` (environnement node) : 200 et `{ status: "ok" }`.
- `src/instrumentation.ts` : `register()` sort si `!isNodeRuntime()` (`src/shared/config/runtime.ts`, lit `process.env.NEXT_RUNTIME`), puis importe dynamiquement `@/shared/config/env.server` et appelle `getServerEnv()` sans capturer l'erreur. `src/shared/config/env.server.ts` (`server-only`) valide `BACKEND_API_URL` (`z.url()`) et lève `Invalid server environment: BACKEND_API_URL: …` (chemin et message Zod, sans la valeur). `src/instrumentation.test.ts` (environnement node, `vi.resetModules()` puis import dynamique, `vi.stubEnv`) : trois tests, dont « (a) runtime Node sans BACKEND_API_URL : rejetée en nommant la variable » (`rejects.toThrow(/BACKEND_API_URL/)`), qui changera avec la décision 8.
- Premier passage de T3 (étape 4) : le serveur de l'image reste en marche sans `BACKEND_API_URL` ; le rejet de `register()` ne suffit pas à l'arrêter.
- Aucun logger : pas de `src/shared/observability/`, aucune dépendance `pino`. Aucun `console.*` dans `src/`.
- `next.config.ts` : `output: "standalone"` ajouté à l'étape 1, enveloppe `createNextIntlPlugin("./src/app/_i18n/request.ts")`. D'après `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md` : la sortie est `.next/standalone/server.js`, `public/` et `.next/static` sont à copier à la main, `PORT` et `HOSTNAME` se règlent par variables d'environnement.
- Pas de dossier `public/` dans le repo.
- `package.json` : `packageManager: pnpm@10.23.0`, `pnpm-lock.yaml` présent ; `pnpm-workspace.yaml` ignore les scripts de build de `sharp` et `unrs-resolver`. Vitest 5, Zod 4.
- `.github/workflows/harness.yml` : généré par `harness ci`, vérification seulement (aucune construction d'image).
- `harness.config.json` : pas de clé `publish`.

## Étapes

### Étape 1 : image de production (sortie standalone, Dockerfile, .dockerignore)

**Fichiers** : `next.config.ts`, `Dockerfile` (nouveau), `.dockerignore` (nouveau)

- `next.config.ts` : `output: "standalone"` dans `nextConfig` (enveloppe next-intl conservée).
- `Dockerfile` multi-étapes, `FROM node:22.23.3-alpine` dans chaque étape (décision 1) :
  - `deps` : `corepack enable`, copie de `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `pnpm install --frozen-lockfile` ;
  - `build` : copie des sources, `pnpm build` (aucune variable d'exécution fournie) ;
  - étape finale : `ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1`, copie de `.next/standalone` et `.next/static` (vers `.next/static`) avec `--chown=1000:1000`, `USER 1000:1000` (utilisateur `node`), `EXPOSE 3000`, `HEALTHCHECK` par `node -e` + `fetch("http://127.0.0.1:3000/api/health")` (sortie 0 si `ok`, 1 sinon), `CMD ["node", "server.js"]` ;
  - aucun `ARG` ni `LABEL` (étiquettes OCI ajoutées par la CI à la publication, décision 7) ; aucun `ENV` hors les quatre variables d'exécution non secrètes ci-dessus.
- `.dockerignore` : `.git`, `.env`, `.env.*`, `node_modules`, `.next`, `out`, `build`, `coverage`, `test-results`, `playwright-report`, `.claude/logs`, `.claude/state`, `*.tsbuildinfo`.

**Critères de succès** :

- [x] `pnpm build` sort en 0 sans fichier `.env` et produit `.next/standalone/server.js` (`test -f .next/standalone/server.js` sort en 0) : le réglage `output` est effectif
- [x] `harness gate arch --rule platform-no-latest-image` sort en 0
- [x] `harness gate arch --rule platform-no-secret-in-image` sort en 0
- [x] `harness gate arch --rule platform-no-add-url` sort en 0
- [x] `harness gate arch --rule platform-no-pipe-to-shell` sort en 0
- [x] Chaque `FROM` du `Dockerfile` référence `node:22.23.3-alpine`, et le `Dockerfile` ne contient aucune instruction `ARG` ni `LABEL` (`grep -nE '^\s*(ARG|LABEL)\b' Dockerfile` ne renvoie rien)
- [x] `.dockerignore` exclut `.env`, `.env.*`, `.git`, `node_modules` et `.next` (une ligne pour chacun)
- [x] T7 passe : `src/app/api/health/route.test.ts` sans modification ; `src/instrumentation.test.ts` passe sans modification
- [x] `pnpm typecheck` et `pnpm test` sortent en 0

### Étape 2 : compose de développement, .env.example, runbook

**Fichiers** : `compose.yaml` (nouveau), `.env.example`, `docs/runbooks/local.md` (nouveau)

- `compose.yaml` : un seul service `web` (décisions 2 et 3, aucune base, aucune migration, aucun service shop-api ni Prism) : `build: .`, `image: shop-web:dev` (nom local, jamais publié), `ports: ["127.0.0.1:${WEB_PORT:-3000}:3000"]`, `environment: BACKEND_API_URL: ${COMPOSE_BACKEND_API_URL:-http://host.docker.internal:8080}`, `extra_hosts: ["host.docker.internal:host-gateway"]`, `healthcheck` reprenant la sonde `node -e` de l'étape 1 (intervalle court, démarrage sain en moins de 30 s), `restart: unless-stopped`, `mem_limit` et `cpus`. Ni `privileged`, ni socket Docker, ni `network_mode: host`.
- `.env.example` : conserve `BACKEND_API_URL=http://localhost:8080` (pour `pnpm dev`), ajoute `WEB_PORT=3000` et `COMPOSE_BACKEND_API_URL=http://host.docker.internal:8080`, chacune avec un commentaire d'une ligne.
- `docs/runbooks/local.md` : prérequis (Docker, `.env` copié de `.env.example`, shop-api lancé sur le poste), puis lancer (`docker compose up -d --wait`), arrêter (`docker compose down`), consulter les journaux (`docker compose logs -f web`), repartir de zéro (`docker compose down --rmi local` puis `docker compose up -d --build --wait`) ; vérifier l'image (`harness tool image-check --build --requires-env`, `harness tool compose-check`, `hadolint Dockerfile`) ; section « Publier une version » (décision 5 : tag `vX.Y.Z` sur main après fusion, publication par la CI avec ses étiquettes OCI, `harness tool release-check vX.Y.Z`, retour arrière au tag précédent).

**Critères de succès** :

- [x] `harness gate arch --prefix platform-` sort en 0 (couvre `platform-compose-no-latest-image`, `platform-compose-no-secret-literal`, `platform-no-privileged`, `platform-no-docker-socket` et les règles du Dockerfile)
- [x] Toute variable référencée par `compose.yaml` (`WEB_PORT`, `COMPOSE_BACKEND_API_URL`) figure dans `.env.example`, sans valeur secrète
- [x] `docs/runbooks/local.md` contient les quatre gestes demandés par la spec (lancer, arrêter, journaux, repartir de zéro), chacun avec sa commande, et la section « Publier une version » avec `harness tool release-check vX.Y.Z`
- [x] `pnpm typecheck` et `pnpm test` sortent en 0 (non-régression)

### Étape 3 : arrêt du serveur réel sur configuration invalide (décisions 8 et 9)

**Fichiers** : `src/instrumentation.ts`, `src/instrumentation.test.ts` (aucun autre fichier, aucune dépendance ajoutée)

- `src/instrumentation.ts` : en runtime Node, `getServerEnv()` dans un `try` ; en cas d'échec, une seule ligne écrite par `process.stderr.write` (JSON ou texte, terminée par un saut de ligne) contenant `Invalid server environment` et les noms des variables en cause, repris du message de l'erreur levée par `getServerEnv()` (qui donne chemin et message Zod, sans la valeur), jamais une valeur de variable ; puis `process.exit(1)`. Aucun `console.*`, aucun `process.env`. Le runtime edge reste inchangé (aucun import de `env.server`).
- `src/instrumentation.test.ts` : `process.exit` simulé (`vi.spyOn(process, "exit").mockImplementation(...)`) et `process.stderr.write` espionné (`vi.spyOn(process.stderr, "write")`), restaurés après chaque test. Le test « (a) runtime Node sans BACKEND_API_URL » devient : `process.exit` appelé une fois avec `1`, et stderr reçoit une ligne qui nomme `BACKEND_API_URL`. Nouveau test : `BACKEND_API_URL=pas-une-url-valeur-secrete` → `process.exit(1)`, la ligne écrite sur stderr nomme `BACKEND_API_URL` et ne contient pas `pas-une-url-valeur-secrete`. Les tests « avec BACKEND_API_URL » (Node) et « runtime edge » vérifient en plus que `process.exit` n'est pas appelé et que rien n'est écrit sur stderr.

**Critères de succès** :

- [x] `pnpm vitest run src/instrumentation.test.ts` sort en 0 : sans `BACKEND_API_URL` en runtime Node, `process.exit(1)` est appelé et stderr reçoit un message qui nomme `BACKEND_API_URL` ; avec une valeur invalide, le message écrit sur stderr nomme `BACKEND_API_URL` sans contenir la valeur ; avec une URL valide et en runtime edge, `process.exit` n'est pas appelé
- [x] `harness gate arch --rule next-no-console` sort en 0
- [x] `harness gate arch --rule next-no-process-env` sort en 0
- [x] `pnpm build` sort en 0 sans fichier `.env` (la construction ne déclenche pas l'arrêt)
- [x] `pnpm typecheck` et `pnpm test` sortent en 0 (dont T7 : `src/app/api/health/route.test.ts` sans modification)

### Étape 4 : preuves humaines de l'image et du compose (point d'arrêt)

**Fichiers** : aucun (corrections éventuelles sur `Dockerfile`, `.dockerignore`, `compose.yaml`, `next.config.ts`, `src/instrumentation.ts` selon les ❌ rapportés, puis nouveau passage)

L'humain lance dans un terminal, à la racine du repo, et colle chaque rapport tel quel :

1. `harness tool image-check --build --requires-env` (T3, à relancer : premier passage invalide, décision 8)
2. `harness tool compose-check` (T4, déjà acquis ; à relancer seulement si l'étape 3 ou une correction touche l'image)
3. `hadolint Dockerfile` (T2, décision 4, déjà acquis)

**Critères de succès** :

- [x] T3 : le rapport de `harness tool image-check --build --requires-env` finit par « ✅ Tous les contrôles passent » (construite, utilisateur non root, sonde de santé, aucun secret ni `.env`, aucun outil de développement, refus de démarrer sans configuration : conteneur arrêté avec un code non nul et un journal qui nomme `BACKEND_API_URL`)
- [x] T4 : le rapport de `harness tool compose-check` finit par « ✅ Tous les contrôles passent » (compose valide, service `web` healthy, tout supprimé ensuite ; partie migrations sans objet, décision 2)
- [x] T2 : `hadolint Dockerfile` sort en 0, ou l'humain indique qu'hadolint n'est pas installé

### Étape 5 : déclaration de la publication et CI (point d'arrêt, gestes humains)

**Fichiers** : `harness.config.json` (humain), `.github/workflows/` (généré par `harness ci`, lancé par l'humain)

L'humain ajoute `"publish": { "image": "ghcr.io/rolandrm/shop-web" }` dans `harness.config.json` (règle 5), lance `harness ci` (règle 4) et le signale ; l'agent vérifie ensuite le résultat sans modifier ces fichiers.

**Critères de succès** :

- [x] `harness.config.json` déclare `publish.image` égal à `ghcr.io/rolandrm/shop-web`
- [x] T6 : le workflow généré par `harness ci` construit l'image sur `pull_request` sans la publier, et la publie en `ghcr.io/rolandrm/shop-web:X.Y.Z` sur les tags `v*`, avec les étiquettes OCI (`--label`) ajoutées par le workflow
- [x] `harness gate arch --prefix platform-` sort en 0
- [x] `pnpm typecheck` et `pnpm test` sortent en 0 (non-régression)
