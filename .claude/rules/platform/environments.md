---
paths:
  - "environments/**"
  - "docs/runbooks/**"
---

# Environnements et déploiement (repo plateforme)

- Un environnement = un dossier `environments/<nom>/` : `compose.yaml` (les versions qui y tournent), `.env.example` (variables attendues, sans valeur), `README.md` (machine, contexte Docker, accès) ; le `.env` réel vit sur la machine ou dans les secrets de la CI, jamais dans git
- La version déployée se lit dans le `compose.yaml` commité : déployer une nouvelle version = une PR qui change un tag d'image, relue, fusionnée sur CI verte
- Machine distante : un contexte Docker par environnement (`docker context create staging --docker "host=ssh://deploy@staging.example.com"`), jamais le socket Docker exposé sur le réseau ; utilisateur de déploiement dédié, accès par clé
- Déployer (geste humain, terminal ou CI déclenchée à la main) :
  `docker --context <env> compose -f environments/<env>/compose.yaml --env-file <.env> pull`
  puis `… up -d --wait` (attend que chaque service soit sain)
- Retour arrière : revenir au commit précédent du `compose.yaml` (les tags d'images précédents) et relancer `pull` puis `up -d --wait` ; une migration de base doit rester compatible avec la version précédente de l'application, sinon le retour arrière est décrit dans le runbook avant le déploiement
- Vérification après déploiement : `docker --context <env> compose … ps` (tous `healthy`) et la sonde de santé publique de chaque application
- Chaque environnement a son runbook (`docs/runbooks/<env>.md`) : déployer, revenir en arrière, consulter les journaux, restaurer une sauvegarde
