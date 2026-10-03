# Spec : web-foundation

- **Statut** : Implemented
- **Auteur** : Harness (socle standard Next.js), à relire par l'équipe
- **Version** : 0.1.0
- **Liée à** : règles `.claude/rules/nextjs/` (shared, general, security, i18n, app-routes, testing)

> **À relire avant d'approuver.** Cette spec est fournie par Harness : c'est
> le socle commun à toute application Next.js de la stack, sans
> fonctionnalité métier. Seuls les choix ci-dessous sont propres au projet ;
> modifiez-les ici si besoin, puis approuvez avec
> `/harness:ship docs/specs/web-foundation.md`.
>
> | Choix                                    | Valeur proposée                                                                                             |
> | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
> | Langues                                  | `fr` (par défaut) et `en`                                                                                   |
> | Variable de l'adresse du backend         | `BACKEND_API_URL` (serveur uniquement)                                                                      |
> | Contrat du backend consommé              | `docs/api/backends/shop-api.openapi.json`, copie versionnée (provenance dans `docs/api/backends/README.md`) |
> | Délai d'expiration des appels au backend | 5 secondes                                                                                                  |

## Contexte

Une application Next.js neuve ne contient que la page de démonstration de
create-next-app : aucune configuration validée, aucun point d'appel au
backend, aucune traduction. Chaque fonctionnalité métier en aurait besoin et
la réinventerait. Ce socle pose une fois les fondations que les règles de la
stack exigent, pour que la première feature n'ait plus qu'à les utiliser.

## Périmètre

**Inclus** :

- `src/shared/config/env.server.ts` (`server-only`) : variables d'environnement serveur validées par Zod au démarrage (`BACKEND_API_URL`, `NODE_ENV`) ; `.env.example` sans valeur réelle
- `src/shared/api/backend-client.ts` (`server-only`) : `backendRequest`, seul `fetch` vers le backend ; `cache: "no-store"`, délai d'expiration, en-têtes `Accept-Language` et `X-Request-Id` ; réponse validée par un schéma Zod passé par l'appelant ; retourne un `Result`
- `src/shared/lib/` : `Result` (succès ou erreur typée) et `formatMoney(amount: string, currency: string, locale: string)` sans conversion en `number`
- `src/shared/i18n/` : `routing.ts` (langues et langue par défaut), `navigation.ts` (`Link`, `redirect`, `useRouter`, `usePathname` de next-intl), `request.ts` (chargement des messages)
- `messages/fr.json` et `messages/en.json` : espaces `common` et `errors`, mêmes clés dans les deux langues
- Routage par langue : `src/proxy.ts` (ou `src/middleware.ts` selon la version de Next.js installée) de next-intl ; segment `src/app/[locale]/` avec `layout.tsx` (`<html lang>` = langue), `page.tsx` (accueil traduit), `loading.tsx`, `error.tsx`, `not-found.tsx` ; `src/app/global-error.tsx`
- `src/app/api/health/route.ts` : `GET` renvoie `200 {"status":"ok"}` sans appeler le backend
- Suppression de la page et des images de démonstration de create-next-app
- Vitest (jsdom, Testing Library, MSW) : `vitest.config.ts`, script `test` dans `package.json`, premiers tests ci-dessous

**Exclus** :

- Toute page ou feature métier (`src/features/`)
- Session, authentification, cookies, `src/shared/auth/`
- TanStack Query et `src/shared/providers/`
- Composants shadcn/ui et `src/shared/ui/`
- Route Handlers BFF `app/api/bff/**`
- Journalisation `pino`, OpenTelemetry (`instrumentation.ts`)
- En-têtes de sécurité de `next.config.ts`
- Tests de bout en bout (Playwright, Prism)

## User stories

### US-001 — Accueil traduit selon la langue de l'URL

**En tant que** visiteur **je veux** voir l'accueil dans ma langue **afin de** comprendre le site

```gherkin
Given l'application démarrée
When je demande /fr
Then la page d'accueil s'affiche avec les textes de messages/fr.json et <html lang="fr">

Given l'application démarrée
When je demande /en
Then la page d'accueil s'affiche avec les textes de messages/en.json et <html lang="en">

Given l'application démarrée
When je demande /
Then je suis redirigé vers /fr
```

### US-002 — Point d'appel unique et sûr vers le backend

**En tant que** développeur d'une feature **je veux** appeler le backend par une seule fonction **afin de** ne jamais gérer moi-même délai, validation et erreurs

```gherkin
Given un backend qui répond 200 avec un corps conforme au schéma demandé
When backendRequest est appelé
Then il retourne un succès contenant les données validées

Given un backend qui répond 200 avec un corps non conforme au schéma
When backendRequest est appelé
Then il retourne une erreur de code INVALID_BACKEND_RESPONSE (statut 502)

Given un backend qui ne répond pas avant le délai d'expiration
When backendRequest est appelé
Then il retourne une erreur de code BACKEND_TIMEOUT (statut 504)

Given un backend qui répond 404 avec un corps d'erreur
When backendRequest est appelé
Then il retourne une erreur portant le code et le statut du backend, sans jamais lever d'exception
```

### US-003 — Configuration invalide détectée au démarrage

**En tant qu'** exploitant **je veux** que l'application refuse de démarrer sans configuration valide **afin de** ne pas découvrir l'erreur au premier appel

```gherkin
Given BACKEND_API_URL absente ou qui n'est pas une URL
When la configuration serveur est chargée
Then le chargement échoue avec un message qui nomme la variable en cause
```

### US-004 — Sonde de vie indépendante du backend

**En tant qu'** exploitant **je veux** une sonde qui répond même si le backend est arrêté **afin de** distinguer une panne du front d'une panne du backend

```gherkin
Given le backend arrêté
When je demande GET /api/health
Then la réponse est 200 avec {"status":"ok"}
```

## Contrat d'API

Exposé par l'application :

- `GET /api/health` → `200` `{"status":"ok"}` ; ne dépend pas du backend.

Consommé : aucun endpoint métier dans ce socle. `backendRequest` est
générique ; les features le spécialisent avec leurs propres schémas Zod,
écrits à la main d'après la copie du contrat du backend
(`docs/api/backends/`).

Format commun des erreurs retournées par `backendRequest` :

```json
{ "code": "INVALID_BACKEND_RESPONSE", "status": 502 }
```

Codes : `INVALID_BACKEND_RESPONSE` (502), `BACKEND_TIMEOUT` (504),
`BACKEND_UNAVAILABLE` (503, réseau injoignable), et pour une réponse
d'erreur du backend : son code (champ `code` du corps s'il existe, sinon
`BACKEND_ERROR`) et son statut. Le `message` du backend n'est jamais
affiché à l'utilisateur.

## Contraintes non fonctionnelles

- Sécurité : `BACKEND_API_URL` n'est jamais exposée au navigateur (aucune variable `NEXT_PUBLIC_*` qui la contienne) ; aucun `.env` commité
- Délai d'expiration des appels au backend : 5 secondes
- `GET /api/health` répond en moins de 100 ms sans dépendance externe
- Aucun appel réseau réel dans les tests (MSW)

## Plan de test

| Id  | Niveau            | Scénario                                                                         | Attendu                                                                      |
| --- | ----------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| T1  | unit              | Configuration avec `BACKEND_API_URL` valide                                      | objet de configuration typé retourné                                         |
| T2  | unit              | Configuration sans `BACKEND_API_URL`, puis avec une valeur qui n'est pas une URL | erreur qui nomme `BACKEND_API_URL`                                           |
| T3  | intégration (MSW) | `backendRequest` sur une réponse 200 conforme                                    | succès avec les données validées                                             |
| T4  | intégration (MSW) | `backendRequest` sur une réponse 200 non conforme                                | erreur `INVALID_BACKEND_RESPONSE`, statut 502                                |
| T5  | intégration (MSW) | `backendRequest` sur une réponse plus lente que le délai                         | erreur `BACKEND_TIMEOUT`, statut 504                                         |
| T6  | intégration (MSW) | `backendRequest` sur une réponse 404 `{"code":"PRODUCT_NOT_FOUND"}`              | erreur `PRODUCT_NOT_FOUND`, statut 404, aucune exception levée               |
| T7  | intégration (MSW) | En-têtes envoyés par `backendRequest`                                            | `Accept-Language` et `X-Request-Id` présents                                 |
| T8  | unit              | `formatMoney("1234.50", "EUR", "fr")` et `formatMoney("1234.50", "EUR", "en")`   | `1 234,50 €` et `€1,234.50` (espaces insécables normalisés dans l'assertion) |
| T9  | unit              | Route `GET /api/health` appelée sans backend                                     | `200` `{"status":"ok"}`                                                      |
| T10 | structure         | Parité des traductions                                                           | `pnpm lint:architecture` sort en 0                                           |
| T11 | structure         | Aucun `process.env` hors `shared/config`                                         | `harness gate arch --rule next-no-process-env` sort en 0                     |
| T12 | structure         | Aucun `fetch` hors `shared/api`                                                  | `harness gate arch --rule next-no-fetch-outside-api` sort en 0               |
| T13 | structure         | Navigation par `shared/i18n` uniquement                                          | `harness gate arch --rule next-i18n-navigation` sort en 0                    |
| T14 | structure         | URL du backend jamais publique                                                   | `harness gate arch --rule next-no-public-backend-url` sort en 0              |
| T15 | structure         | Aucun texte d'interface en dur, page de démonstration supprimée                  | `pnpm lint` sort en 0                                                        |

## Risques

- API de next-intl ou fichier de routage (`proxy.ts` / `middleware.ts`) différents selon la version installée : lire la documentation embarquée dans `node_modules/next/dist/docs/` et celle de next-intl avant d'écrire ; un écart se voit au build
- Un module `server-only` importé par erreur côté client casse le build : c'est voulu, le build le signale
- Formatage monétaire dépendant de la version d'ICU de Node : assertions sur la valeur normalisée (espaces insécables)
- Délai d'expiration trop court pour un backend lent en développement : valeur centralisée dans `backend-client.ts`

## Déploiement et retour arrière

- **Ordre de mise en place** : définir `BACKEND_API_URL` dans l'environnement cible avant de déployer ; aucune migration
- **Compatibilité** : Sans objet : première version de l'application, aucune version précédente en service
- **Retour arrière** : redéployer la version précédente ; rien n'est perdu (aucune donnée écrite par l'application)
- **Vérification après déploiement** : `GET /api/health` renvoie `200` et `/fr` affiche l'accueil traduit
