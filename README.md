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

L'application est protégée par une authentification par token JWT (session stockée dans un cookie `httpOnly`), avec 3 rôles :

- **Admin** : accès à toutes les SCI (page `/`).
- **Bailleur** : compte lié à une seule SCI (`Bailleur` dans "Utilisateurs"), scopé à `/[profileId]`. `/` le redirige directement vers son espace.
- **Locataire** : compte lié à un seul locataire (email + mot de passe stockés directement sur la fiche du locataire dans la base "Locataires"), scopé en lecture seule à `/[profileId]/tenants/[tenantId]` — il ne voit que l'historique de ses propres quittances, sans pouvoir en générer.

Il n'y a pas d'inscription publique : chaque compte est provisionné manuellement dans Notion (email + rôle, sans mot de passe), avec un code d'activation à usage unique. L'utilisateur va ensuite sur `/activation`, saisit son email + le code reçu, et définit son mot de passe.

### Comptes Admin / Bailleur

1. Dans Notion, la base **"Utilisateurs"** (sous-page de "Quittances Loyer") a les propriétés :
   - `Email` : titre (title)
   - `Mot de passe` : texte (rich text) — hash du mot de passe, vide tant que le compte n'est pas activé
   - `Prénom`, `Nom` : texte (rich text)
   - `Rôle` : select (`Admin` ou `Bailleur`)
   - `Bailleur` : relation vers la base "Bailleurs" — la SCI gérée (uniquement pour le rôle `Bailleur`)
   - `Code d'activation` : texte (rich text) — code à usage unique, effacé après activation
2. Renseigne dans `.env.local` :
   - `NOTION_UTILISATEURS_DATA_SOURCE_ID` : ID de la data source de cette base.
   - `JWT_SECRET` : chaîne aléatoire utilisée pour signer les tokens de session (`openssl rand -base64 32`).

### Comptes Locataire

La base **"Locataires"** a 3 propriétés supplémentaires : `Email` (email), `Code de vérification` (rich text), `Mot de passe` (rich text, hash). Depuis la fiche d'un locataire (`Modifier` dans le tableau de bord de la SCI), le bailleur/admin renseigne l'email du locataire et clique sur **"Générer un code d'activation"** : le code s'affiche une seule fois et doit être transmis manuellement (SMS, email...) au locataire, qui l'utilise sur `/activation`.

Toutes les pages et routes API (sauf `/login`, `/activation` et `/api/auth/*`) exigent une session valide et vérifient le rôle/la propriété des données ; les visiteurs non connectés sont redirigés vers `/login`.
