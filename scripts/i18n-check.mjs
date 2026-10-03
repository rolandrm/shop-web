#!/usr/bin/env node
// Template — verrou 4 du harness Next.js : toutes les locales ont exactement les mêmes clés.
// Installé par `harness init` (scripts/i18n-check.mjs), qui le
// déclare dans le script "lint:architecture" de package.json.
// Catalogues vérifiés : messages/ (common, errors) et src/features/*/messages/.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? process.cwd();
const featuresDir = join(root, "src/features");
const catalogs = [
  join(root, "messages"),
  ...(existsSync(featuresDir)
    ? readdirSync(featuresDir).map((f) => join(featuresDir, f, "messages"))
    : []),
].filter(existsSync);

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

let problems = 0;
for (const dir of catalogs) {
  const locales = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const keys = new Map(
    locales.map((l) => [l, new Set(flatten(JSON.parse(readFileSync(join(dir, l), "utf8"))))]),
  );
  const all = new Set([...keys.values()].flatMap((s) => [...s]));
  for (const [locale, set] of keys) {
    const missing = [...all].filter((k) => !set.has(k));
    if (missing.length) {
      problems += missing.length;
      console.error(`❌ ${join(dir, locale)} : manque ${missing.join(", ")}`);
    }
  }
}

if (problems > 0) process.exit(1);
console.log(`✅ i18n : ${catalogs.length} catalogue(s), clés identiques dans toutes les locales`);
