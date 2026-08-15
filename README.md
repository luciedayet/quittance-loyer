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

## Authentification

L'application est protégée par une authentification par token JWT (session stockée dans un cookie `httpOnly`) adossée à une base Notion **"Utilisateurs"**.

1. Dans Notion, crée une base **"Utilisateurs"** (sous-base de la page **"Quittances Loyer"**, connectée à l'intégration comme les autres bases) avec les propriétés suivantes :
   - `Email` : titre (title)
   - `Mot de passe` : texte (rich text) — stocke le hash du mot de passe, jamais le mot de passe en clair
   - `Nom` : texte (rich text)
2. Renseigne dans `.env.local` :
   - `NOTION_UTILISATEURS_DATA_SOURCE_ID` : ID de la data source de cette base.
   - `JWT_SECRET` : chaîne aléatoire utilisée pour signer les tokens de session (`openssl rand -base64 32`).
   - `AUTH_REGISTRATION_SECRET` : code d'invitation requis pour créer un compte sur `/register`. Sans ce code, l'inscription est désactivée — cela évite que n'importe qui puisse créer un compte et accéder aux données de tes SCI.
3. Va sur `/register`, saisis le code d'invitation pour créer ton compte, puis connecte-toi sur `/login`.

Toutes les pages et routes API (sauf `/login`, `/register` et `/api/auth/*`) exigent une session valide ; les visiteurs non connectés sont redirigés vers `/login`.
