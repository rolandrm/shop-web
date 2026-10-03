---
paths:
  - "src/**/*.tsx"
---

# UI, accessibilité et performance

- shadcn/ui (Radix) pour dialogues, menus, onglets : ne pas réimplémenter le focus
- Tailwind uniquement, fusion via `cn()`, variantes via `class-variance-authority` ; pas de valeur arbitraire (`w-[327px]`) sauf exception commentée
- Tableaux : TanStack Table (pattern data table shadcn), tri / filtres / pagination dans l'URL, exécutés par le backend (curseur)
- Graphiques : Recharts via `Chart` shadcn, chargés par `next/dynamic`, avec alternative accessible ; agrégations au backend
- `next/image` pour toute image (avec dimensions), `next/font` pour les polices ; jamais `<img>`
- Bibliothèque lourde côté client → `next/dynamic`
- WCAG 2.2 AA : HTML sémantique, un seul `h1`, labels sur tous les champs, `alt` traduit, clavier, focus visible
- Liens `target="_blank"` avec `rel="noopener noreferrer"`
