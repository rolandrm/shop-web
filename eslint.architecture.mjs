// Template ESLint (flat config) — règles d'architecture du harness Next.js (verrou 3)
// Installé par `harness init` (eslint.architecture.mjs), qui
// l'étale aussi dans eslint.config.mjs, APRÈS les configurations Next.js
// (core-web-vitals), React Hooks et jsx-a11y (qui enregistrent le plugin
// `react`) :
//   import architecture from "./eslint.architecture.mjs";
//   export default [...autresConfigs, ...architecture];
//
// En flat config, une surcharge de `no-restricted-syntax` / `no-restricted-imports`
// REMPLACE la liste précédente : chaque bloc répète donc ce qu'il garde.

const OFF_STACK = [
  "axios", "swr", "moment", "dayjs", "luxon", "lodash", "chart.js", "react-chartjs-2",
  "echarts", "ag-grid-react", "formik", "yup", "redux", "@reduxjs/toolkit", "zustand",
  "jotai", "styled-components", "@emotion/react", "@emotion/styled", "react-i18next",
  "next-auth",
].map((name) => ({
  name,
  message: "Hors stack standard — écart à justifier dans la documentation du projet.",
}));

const NAVIGATION = [
  { name: "next/link", message: "Utiliser Link de shared/i18n/navigation (conserve la locale)." },
  {
    name: "next/navigation",
    importNames: ["redirect", "useRouter", "usePathname"],
    message: "Utiliser les helpers de shared/i18n/navigation (conservent la locale).",
  },
];

const PROCESS_ENV = {
  selector: "MemberExpression[object.name='process'][property.name='env']",
  message: "Lire la configuration via shared/config.",
};
const BROWSER_STORAGE = {
  selector: "MemberExpression[object.name=/^(localStorage|sessionStorage)$/]",
  message: "Aucun stockage navigateur pour des données de session.",
};
const PARSE_FLOAT = {
  selector: "CallExpression[callee.name='parseFloat']",
  message: "Jamais de parseFloat sur un montant : chaîne + formatMoney.",
};
// jsx-no-literals ignore les props (sinon chaque className serait signalé) :
// les attributs visibles par l'utilisateur sont couverts ici.
const A11Y_LITERALS = {
  selector: "JSXAttribute[name.name=/^(aria-label|alt|title|placeholder)$/] > Literal",
  message: "Texte d'interface via next-intl, y compris aria-label, alt, title, placeholder.",
};

const architecture = [
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
      "react/no-danger": "error",
      "react/jsx-no-literals": ["error", { noStrings: true, ignoreProps: true }],
      "no-restricted-imports": ["error", {
        paths: [...OFF_STACK, ...NAVIGATION],
        patterns: [{ group: ["@mui/*", "@chakra-ui/*", "antd", "@nivo/*"], message: "Hors stack standard." }],
      }],
      "no-restricted-syntax": ["error", PROCESS_ENV, BROWSER_STORAGE, PARSE_FLOAT, A11Y_LITERALS],
    },
  },
  {
    // Seul endroit où process.env est lu
    files: ["src/shared/config/**/*.ts"],
    rules: { "no-restricted-syntax": ["error", BROWSER_STORAGE, PARSE_FLOAT] },
  },
  {
    // Les helpers de navigation typés enveloppent next/link et next/navigation
    files: ["src/shared/i18n/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { paths: OFF_STACK }] },
  },
];

export default architecture;
