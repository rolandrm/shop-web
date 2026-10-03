---
paths:
  - ".dependency-cruiser.cjs"
  - "eslint.config.mjs"
---

# Vérification automatique (Next.js)

- Verrou 1 — dependency-cruiser : pas de cross-feature, `app/` → surfaces publiques, `shared/` isolé, `index.ts` sans serveur, `hooks/` sans serveur, `model/` pur, pas de cycle
- Verrou 2 — `server-only` en tête de tout module serveur (import depuis le client = build cassé)
- Verrou 3 — ESLint : `no-console`, textes JSX en dur, imports hors stack, `next/link`, `process.env`, stockage navigateur, `parseFloat`, `react/no-danger`, `jsx-a11y`
- Verrou 4 — traductions : mêmes clés dans toutes les locales (`pnpm i18n:check`)
- Verrou 5 — `prettier --check` (+ `prettier-plugin-tailwindcss`)
- Invariants déclaratifs : `arch-gate.mjs` (règles `next-*`) ; structurels : `tests/structural/nextjs-features.test.mjs`
- Typage : commande `typecheck` de `harness.config.json` = `tsc --noEmit` (tout le projet, tests compris), lancée par `harness verify` après `build`
- Nouvelle règle INTERDIT → son verrou dans la même PR ; violation tolérée seulement avec `// TODO(archi): <tâche>`
