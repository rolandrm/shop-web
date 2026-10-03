// Template dependency-cruiser — harness Next.js (verrou 1)
// À copier à la racine de l'app web (.dependency-cruiser.cjs).
// Les chemins sont relatifs à cette racine. Lancer : pnpm depcruise src
// Vérifier la syntaxe du group matching ($1) selon la version installée.

const SERVER_CODE =
  "(^src/features/[^/]+/server)|(^src/shared/(api/backend-client|auth/|config/env\\.server))";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-cross-feature",
      severity: "error",
      comment: "Une feature ne connaît jamais une autre feature : composition dans app/",
      from: { path: "^src/features/([^/]+)/" },
      to: { path: "^src/features/", pathNot: "^src/features/$1/" },
    },
    {
      name: "app-uses-feature-public-api-only",
      severity: "error",
      comment: "app/ n'importe que features/X/index.ts et features/X/server.ts",
      from: { path: "^src/app/" },
      to: {
        path: "^src/features/[^/]+/",
        pathNot: "^src/features/[^/]+/(index|server)\\.tsx?$",
      },
    },
    {
      name: "shared-knows-nothing",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(features|app)/" },
    },
    {
      name: "client-api-never-reexports-server",
      severity: "error",
      comment: "index.ts est client-safe",
      from: { path: "^src/features/[^/]+/index\\.tsx?$" },
      to: { path: SERVER_CODE },
    },
    {
      name: "hooks-never-touch-server-code",
      severity: "error",
      from: { path: "^src/features/[^/]+/hooks/" },
      to: { path: SERVER_CODE },
    },
    {
      name: "model-is-pure",
      severity: "error",
      from: { path: "^src/features/[^/]+/model/" },
      to: {
        path: "(^src/features/[^/]+/(components|hooks|server))|node_modules/(react|react-dom|next|@tanstack)/",
      },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    doNotFollow: { path: "node_modules" },
  },
};
