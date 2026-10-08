# ADR 0001 : Contrat du backend copié et versionné dans le front

- **Statut** : Acceptée
- **Date** : 2026-10-03
- **Décideurs** : rolandrm
- **Liée à** : `CLAUDE.md` (section « Backend consommé »), `docs/specs/web-foundation.md`, `docs/specs/catalog-products-list.md`

## Contexte

shop-web consomme l'API de shop-api, développée par une autre équipe dans un
autre dépôt, qui n'a pas à être présent sur le poste d'un développeur front
ni dans la CI de shop-web (elle ne clone que shop-web). La première version de
`CLAUDE.md` désignait le contrat par `../shop-api/docs/api/openapi.json` :
un chemin qui ne marche que si les deux dépôts sont côte à côte, et qui lit
l'état du jour de l'autre dépôt, peut-être une branche en cours, plutôt
qu'une version publiée.

## Options envisagées

1. **Lire le contrat dans le dépôt voisin** (`../shop-api/…`) : aucune copie,
   mais casse en CI et chez quiconque n'a pas les deux dépôts ; contrat non
   figé.
2. **Paquet partagé** (contrat publié sur un registre de paquets) : versionné
   et automatisable, mais demande un registre, une publication par le
   backend et une dépendance de plus.
3. **Copie versionnée dans le front, avec sa provenance** : un fichier commité
   (`docs/api/backends/shop-api.openapi.json`), mis à jour par un geste humain
   relu en PR.

## Décision

Option 3. Le contrat est une copie versionnée dans shop-web ; sa mise à jour
passe par `harness tool contract-pull shop-api <version>` (Harness 0.6.0), qui
enregistre la provenance (`shop-api.source.json` : dépôt, version, commit,
date) et classe les changements en compatibles ou cassants. L'adresse du
serveur qui tourne est une autre chose : la variable `BACKEND_API_URL`.

## Conséquences

- shop-web se construit, se teste et passe sa CI sans shop-api nulle part.
- Les schémas Zod sont écrits à la main d'après la copie, champs utilisés
  seulement (règle `model-schemas`) ; MSW simule le backend d'après elle.
- Un changement cassant du contrat se commite avec la feature qui adapte ces
  schémas, jamais seul : sinon le front refuse les réponses
  (`INVALID_BACKEND_RESPONSE`).
- Interdit : lire le contrat dans un autre dépôt.
- À surveiller : l'équipe shop-api doit taguer ses versions (`vX.Y.Z`) pour
  que `contract-pull` sache quelle version est stable.
