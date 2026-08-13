# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Configuration Notion

Les données (bailleurs, locataires, historique des quittances) sont stockées dans des bases Notion au lieu du `localStorage` du navigateur.

1. Crée une intégration interne sur https://www.notion.so/my-integrations et récupère sa clé secrète (`Internal Integration Secret`).
2. Dans Notion, ouvre la page **"Quittances Loyer"** (créée pour ce projet) et clique sur **"Connexions"** (`···` en haut à droite → `Connexions` → sélectionne ton intégration) afin de lui donner accès à cette page et à ses sous-bases (`Bailleurs`, `Locataires`, `Quittances`).
3. Copie `.env.example` vers `.env.local` et renseigne :
   - `NOTION_API_KEY` : la clé secrète de l'intégration.
   - `NOTION_BAILLEURS_DATA_SOURCE_ID` et `NOTION_LOCATAIRES_DATA_SOURCE_ID` : IDs des data sources des bases Notion correspondantes (requis).
   - `NOTION_QUITTANCES_DATA_SOURCE_ID` : optionnel, active l'historique des quittances générées.
4. Lance `npm run dev` : les SCI (bailleurs) et locataires sont désormais lus/écrits via l'API Notion (routes `app/api/tenants/*` côté serveur, `NOTION_API_KEY` n'est jamais exposée au navigateur).
