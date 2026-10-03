---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Règles Next.js transverses (frontend + BFF)

- Une seule bibliothèque par sujet : App Router, Tailwind, shadcn/ui, TanStack Query / Table, Zod, React Hook Form, `nuqs`, next-intl, `date-fns`, Recharts, `pino`
- Interdit hors écart justifié : `axios`, SWR, Redux / Zustand / Jotai, Formik / Yup, `styled-components` / Emotion, MUI / Chakra / Ant, `react-i18next`, `moment` / `dayjs` / `luxon`, AG Grid / Chart.js / ECharts / Nivo, `lodash` complet, NextAuth, Jest
- Aucune logique métier : le backend est la source de vérité ; le front valide les formats, mappe et relaie
- Le navigateur ne parle JAMAIS au backend : uniquement Server Actions et Route Handlers `app/api/bff/**`
- Aucun jeton accessible au JavaScript client (ni `localStorage`, ni `sessionStorage`, ni props, ni état React)
- Aucun `process.env` hors `shared/config` ; aucun `console.*` (logger serveur de `shared/observability`)
- Aucun `dangerouslySetInnerHTML`
- Aucune arithmétique sur un montant : chaîne + `formatMoney` ; jamais `parseFloat`, `Number()`, `toFixed`
- Aucune donnée mockée dans le code applicatif (MSW et Prism uniquement)
- Ces règles décrivent l'ÉTAT RÉEL ; une décision non implémentée est marquée 🎯 et listée dans les chantiers ouverts
