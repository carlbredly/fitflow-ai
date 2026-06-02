# FitAI Coach

Application web de coaching fitness et nutrition assistée par intelligence artificielle. FitAI Coach accompagne l'utilisateur de l'onboarding à la progression quotidienne : macros personnalisées, programme sportif, journal alimentaire, statistiques et assistant conversationnel.

---

## Sommaire

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Base de données](#base-de-données)
- [Scripts disponibles](#scripts-disponibles)
- [Routes applicatives](#routes-applicatives)
- [API](#api)
- [Structure du projet](#structure-du-projet)
- [Design system](#design-system)
- [Licence](#licence)

---

## Aperçu

FitAI Coach est une application **mobile-first** construite avec **Next.js 15** et **Supabase**. Les fonctionnalités IA (génération de plan, scan de repas, coach chat) s'appuient sur l'API **DeepSeek**, avec des replis locaux lorsque l'IA est indisponible.

```
┌──────────────────────────────────────────┐
│  Client — Next.js (App Router, React 19) │
│  Pages · composants · hooks · stores     │
├──────────────────────────────────────────┤
│  API — Route Handlers (`/api/*`)         │
│  Auth JWT · logique métier · appels IA   │
├──────────────────────────────────────────┤
│  Supabase — Auth · PostgreSQL · RLS      │
├──────────────────────────────────────────┤
│  DeepSeek — Chat · Vision · génération   │
└──────────────────────────────────────────┘
```

---

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Authentification** | Inscription et connexion par e-mail ; OAuth Google ; garde de routes (`AuthRouter`) ; profil créé automatiquement à l'inscription. |
| **Onboarding** | Parcours en 4 étapes (profil, objectif, équipement, validation) ; calcul BMR / TDEE / macros (Mifflin-St Jeor) ; génération du programme sportif (IA + repli local) ; planification des séances sur toute la durée du programme. |
| **Accueil** | Synthèse calorique et macros du jour ; séance du jour ; derniers repas ; indicateurs poids et progression. |
| **Nutrition** | Journal par repas ; saisie manuelle ; scan photo (vision IA) ; recherche d'aliments ; plan repas IA. |
| **Entraînement** | Programme hebdomadaire issu de l'onboarding ; séance du jour ; suivi des exercices ; mode séance avec minuteur. |
| **Progrès** | Courbes de poids et calories (7 jours) ; enregistrement du poids ; check-in hebdomadaire avec ajustements suggérés. |
| **Coach IA** | Chat contextuel (profil, macros, stats du jour) ; suggestions rapides. |
| **Profil** | Édition du profil, cibles quotidiennes, notifications, confidentialité, déconnexion. |

---

## Stack technique

| Domaine | Technologies |
|---------|----------------|
| Framework | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS v4, Radix UI, shadcn/ui, Lucide |
| Données | Supabase (PostgreSQL, Auth, RLS) |
| État & requêtes | TanStack Query, Zustand |
| Visualisation | Recharts |
| IA | DeepSeek API (chat, vision, génération de plans) |
| Qualité | ESLint, `eslint-config-next` |

---

## Prérequis

- **Node.js** 20 ou supérieur
- **npm** 10 ou supérieur
- Un projet **Supabase** (URL, clé anon, clé service role)
- Une clé **DeepSeek** (recommandée pour les fonctions IA ; l'application fonctionne en mode dégradé sans elle)

---

## Installation

```bash
git clone <url-du-depot>
cd fitflow-ai
npm install
```

Créez un fichier `.env.local` à la racine (voir [Configuration](#configuration)), initialisez la base Supabase (voir [Base de données](#base-de-données)), puis lancez le serveur de développement.

---

## Configuration

Fichier `.env.local` :

| Variable | Obligatoire | Description |
|----------|:-----------:|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé publique (anon) Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Clé service role (routes API côté serveur uniquement) |
| `DEEPSEEK_API_KEY` | Non | Clé API DeepSeek pour scan, chat et génération de plans |

Exemple :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEEPSEEK_API_KEY=sk-...
```

### OAuth Google (optionnel)

1. Créer un client OAuth Web dans la [Google Cloud Console](https://console.cloud.google.com).
2. Définir l'URI de redirection : `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Activer le fournisseur Google dans Supabase → **Authentication** → **Providers**.
4. Ajouter `http://localhost:3000/**` aux **Redirect URLs** du projet Supabase.

---

## Base de données

Exécuter le script `supabase_schema.sql` dans **Supabase → SQL Editor**. Il provisionne les tables suivantes :

| Table | Rôle |
|-------|------|
| `profiles` | Profil, objectifs, équipement, dates de programme |
| `food_logs` | Journal alimentaire quotidien |
| `weight_logs` | Historique de poids |
| `workout_sessions` | Séances et exercices (JSONB) |
| `chat_messages` | Historique du coach IA |
| `daily_targets` | Objectifs macros par jour |
| `weekly_checkins` | Check-ins et ajustements hebdomadaires |

Le schéma active le **Row Level Security (RLS)** sur toutes les tables et le trigger `handle_new_user()` pour la création automatique du profil à l'inscription.

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement sur [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Build de production |
| `npm start` | Démarrage du serveur après build |
| `npm run lint` | Analyse ESLint |

---

## Routes applicatives

| Route | Accès | Description |
|-------|-------|-------------|
| `/login` | Public | Connexion et inscription |
| `/onboarding` | Authentifié | Configuration initiale du profil |
| `/` | Authentifié | Tableau de bord |
| `/nutrition` | Authentifié | Journal, scanner, recherche |
| `/workout` | Authentifié | Programme et séance du jour |
| `/progress` | Authentifié | Statistiques et check-in |
| `/chat` | Authentifié | Coach IA |
| `/profile` | Authentifié | Paramètres et compte |

Les utilisateurs non connectés sont redirigés vers `/login`. Un profil incomplet déclenche une redirection vers `/onboarding`.

---

## API

Les routes API sont exposées sous `/api/*`. Les endpoints protégés attendent un en-tête `Authorization: Bearer <access_token>` (session Supabase).

| Endpoint | Méthodes | Description |
|----------|----------|-------------|
| `/api/auth/register` | POST | Inscription |
| `/api/auth/login` | POST | Connexion |
| `/api/auth/me` | GET | Utilisateur courant |
| `/api/profile` | GET | Profil |
| `/api/onboarding` | POST | Finalisation onboarding |
| `/api/food-logs` | GET, POST | Journal alimentaire |
| `/api/food-logs/[id]` | DELETE | Suppression d'une entrée |
| `/api/weight-logs` | GET, POST | Poids |
| `/api/workout-sessions` | GET, POST | Séances |
| `/api/dashboard/stats` | GET | Statistiques tableau de bord |
| `/api/ai/generate-plan` | POST | Plan macros + programme sportif |
| `/api/ai/meal-plan` | POST | Plan repas du jour |
| `/api/ai/scan-food` | POST | Analyse photo de repas |
| `/api/ai/search-food` | POST | Recherche d'aliments |
| `/api/ai/chat` | POST | Message coach IA |
| `/api/ai/chat/stream` | POST | Chat en streaming (SSE) |
| `/api/health` | GET | Santé de l'API |

---

## Structure du projet

```
fitflow-ai/
├── public/                 # Assets statiques, PWA
├── supabase_schema.sql     # Schéma PostgreSQL
├── next.config.ts
├── package.json
└── src/
    ├── app/                # Pages et Route Handlers (App Router)
    │   ├── api/            # Endpoints REST
    │   ├── login/
    │   ├── onboarding/
    │   ├── nutrition/
    │   ├── workout/
    │   ├── progress/
    │   ├── profile/
    │   ├── chat/
    │   ├── layout.tsx
    │   ├── page.tsx        # Accueil
    │   └── globals.css
    ├── components/
    │   ├── app/            # Shell, navigation, composants métier
    │   └── ui/             # Primitives shadcn/ui
    ├── hooks/              # Logique client (auth, profil, nutrition…)
    ├── lib/                # Supabase, IA, calculs, plans sportifs
    ├── stores/             # État global (Zustand)
    └── types/              # Types TypeScript partagés
```

Fichiers métier notables :

- `src/lib/calculations.ts` — BMR, TDEE, répartition des macros
- `src/lib/workout-plan.ts` — Génération et planification des séances
- `src/lib/ai-service.ts` — Client des fonctionnalités IA
- `src/components/app/AuthRouter.tsx` — Protection des routes

---

## Design system

Interface sombre orientée performance, pensée pour mobile (cible ~390 px).

| Élément | Valeur |
|---------|--------|
| Fond principal | `#0D0D0D` (thème dark gym) |
| Accent | Vert `#00E5A0` |
| Secondaire | Orange `#FF6B35` |
| Display | Syne |
| Corps | DM Sans |
| Données / chiffres | JetBrains Mono |

Les utilitaires globaux (`glass`, `grad-accent`, animations) sont définis dans `src/app/globals.css`.

---

## Licence

MIT — voir le dépôt pour les conditions d'utilisation.
