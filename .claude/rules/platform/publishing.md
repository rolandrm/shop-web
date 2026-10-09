---
paths:
  - "**/Dockerfile"
  - ".github/workflows/**"
---

# Publication des images (repo d'une application)

- L'image se publie par la CI, sur un tag vérifié (`vX.Y.Z`, `harness verify` vert) : `ghcr.io/<org>/<app>:X.Y.Z` ; jamais depuis un poste
- Un tag d'image publié ne change jamais : republier la même version est refusé, une correction est une nouvelle version
- Chaque PR prouve que l'image se construit (`docker build` en CI, sans publication) : un Dockerfile cassé ne doit pas se découvrir au tag
- Déclaré dans `harness.config.json` : `"publish": { "image": "ghcr.io/<org>/<app>" }` ; `harness ci` ajoute la construction (PR) et la publication (tag)
