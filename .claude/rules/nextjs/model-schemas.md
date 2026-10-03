---
paths:
  - "src/features/*/model/**/*.ts"
  - "src/features/*/schemas/**/*.ts"
---

# Modèle de vue et schémas

- `model/` : TypeScript pur, testable sans React ; aucun import React, Next, TanStack, `components/`, `hooks/`, `server/`
- `schemas/` : Zod écrit à la main ; réponses backend limitées aux champs utilisés ; types par `z.infer`, jamais dupliqués
- Un schéma partagé entre formulaire (client) et Server Action (serveur) ; la validation serveur fait foi
- Montants en chaîne ; dates ISO 8601 UTC en chaîne
- Générer les types depuis l'OpenAPI du backend est un écart
