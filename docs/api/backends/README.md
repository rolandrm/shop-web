# Contrats des backends consommés

Une copie versionnée du contrat OpenAPI de chaque backend consommé par
shop-web (ADR 0001). Elle ne se modifie jamais à la main.

| Fichier | Rôle |
| --- | --- |
| `<backend>.openapi.json` | le contrat, tel que le backend l'a publié |
| `<backend>.source.json` | sa provenance : dépôt, version (tag), commit, date de récupération |

Mise à jour, dans un terminal, sur une branche :

```bash
harness tool contract-pull shop-api --check     # une version plus récente existe-t-elle ?
harness tool contract-pull shop-api v1.1.0      # met à jour la copie et sa provenance
```

La commande classe chaque changement en compatible ou cassant. Un changement
cassant se commite avec la feature qui adapte les schémas Zod concernés,
jamais seul. Les backends sont déclarés dans `harness.config.json`
(`backends`).
