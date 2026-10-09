# Runbook : exécution locale en conteneur

## Prérequis

- Docker (avec Compose) installé
- Un `.env` à la racine, copié de `.env.example` : `cp .env.example .env`
- shop-api lancé sur le poste (port 8080 par défaut)

## Lancer

```bash
docker compose up -d --wait
```

shop-web répond sur `http://127.0.0.1:${WEB_PORT:-3000}`.

## Arrêter

```bash
docker compose down
```

## Consulter les journaux

```bash
docker compose logs -f web
```

## Repartir de zéro

```bash
docker compose down --rmi local
docker compose up -d --build --wait
```

## Vérifier l'image

```bash
harness tool image-check --build --requires-env
harness tool compose-check
hadolint Dockerfile
```

## Publier une version

1. Après fusion, poser le tag `vX.Y.Z` sur `main` et le pousser.
2. La CI (générée par `harness ci`) construit et publie l'image
   `ghcr.io/rolandrm/shop-web:X.Y.Z` avec ses étiquettes OCI.
3. Contrôler la livraison :

   ```bash
   harness tool release-check vX.Y.Z
   ```

4. Retour arrière : redéployer l'image du tag précédent
   (`ghcr.io/rolandrm/shop-web:<version précédente>`).
