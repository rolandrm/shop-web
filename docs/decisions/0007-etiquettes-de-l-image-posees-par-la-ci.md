# ADR 0007 : Étiquettes de l'image posées par la CI

- **Statut** : Acceptée
- **Date** : 2026-10-09
- **Décideurs** : rolandrm
- **Liée à** : `docs/specs/container-image.md` (US-004, T6), `Dockerfile`, `.github/workflows/harness.yml` (généré par `harness ci`)

## Contexte

Une image publiée doit dire d'où elle vient : dépôt, version, commit
(étiquettes OCI `org.opencontainers.image.source`, `.version`,
`.revision`). Le premier plan prévoyait `ARG VERSION` / `ARG REVISION` et des
`LABEL` dans le Dockerfile, « renseignés par la CI ». Or le workflow généré
par `harness ci` ne transmet aucun argument de construction : il pose
lui-même ces étiquettes (`docker build --label`). Les `LABEL` du Dockerfile
seraient restés vides, en double.

## Options envisagées

1. **`ARG` + `LABEL` dans le Dockerfile, valeurs passées par `--build-arg`** :
   l'image construite à la main peut porter des étiquettes, mais le
   workflow généré devrait être modifié à la main.
2. **Étiquettes posées par la CI seulement** : le Dockerfile reste sans
   métadonnée de publication ; le workflow généré fait foi.

## Décision

Option 2 : seule la CI publie une image ; c'est elle qui sait quel tag et
quel commit elle publie. Le Dockerfile ne déclare ni `LABEL` ni `ARG` pour
ces étiquettes.

## Conséquences

- Chaque image publiée `ghcr.io/rolandrm/shop-web:X.Y.Z` porte dépôt,
  version et commit.
- Une image construite sur un poste (`shop-web:check`, `shop-web:dev`) n'a
  pas ces étiquettes : elle n'est jamais publiée.
- Interdit : publier une image depuis un poste.
