# ADR 0008 : Compose de développement sans backend

- **Statut** : Acceptée
- **Date** : 2026-10-09
- **Décideurs** : rolandrm
- **Liée à** : `docs/specs/container-image.md` (US-002, T4), `compose.yaml`, `.env.example`, `docs/runbooks/local.md`

## Contexte

Le compose de développement lance l'application construite localement.
shop-web n'a pas de base de données ; il appelle shop-api, dont il exige
l'URL au démarrage (`BACKEND_API_URL`). Dans un conteneur, `localhost`
désigne le conteneur lui-même, pas le poste où tourne shop-api.

## Options envisagées

1. **Service `web` seul, backend sur le poste** :
   `BACKEND_API_URL` vers `host.docker.internal:8080`
   (`extra_hosts: host-gateway`), surchargeable par `COMPOSE_BACKEND_API_URL`.
2. **shop-api et sa base dans ce compose**, depuis l'image publiée : pile
   complète en une commande, mais shop-web porterait la configuration de
   shop-api (base, migration, variables), en double avec shop-platform.

## Décision

Option 1 : le compose de shop-web lance shop-web, et lui seul. La pile
complète (shop-api, shop-web, base) est le rôle de l'environnement `local`
du repo shop-platform, à partir des images publiées.

## Conséquences

- `docker compose up` exige shop-api lancé sur le poste (ou
  `COMPOSE_BACKEND_API_URL` vers un autre backend) ; la sonde
  `/api/health` reste verte sans backend.
- Aucune configuration de shop-api dans ce repo.
- Si l'équipe ajoute un jour une base à shop-web, le compose gagnera la
  base et sa migration, par une nouvelle spec.
