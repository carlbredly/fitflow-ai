# ⚡ FitAI Coach

> Coach fitness & nutrition IA personnalisé — planification, suivi et optimisation en temps réel.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Variables d'environnement](#-variables-denvironnement)
- [Base de données](#-base-de-données)
- [Démarrage](#-démarrage)
- [API Backend](#-api-backend)
- [Structure du projet](#-structure-du-projet)

---

## ⚡ Fonctionnalités

### 🔐 Authentification
- Email / mot de passe
- Google OAuth
- Création automatique de profil via trigger Supabase
- Route guard — redirection automatique vers `/login` si non authentifié

### 🎯 Onboarding intelligent
- 4 étapes : infos personnelles → objectif & mode → durée & équipement → plan généré
- Calcul BMR / TDEE / Macros via formule Mifflin-St Jeor
- **Génération IA** (DeepSeek) du plan complet : macros + programme sportif
- Sauvegarde automatique dans Supabase (`profiles` + `workout_sessions`)

### 🏠 Dashboard
- Anneau calorique animé (SVG)
- Macros du jour avec barres de progression
- Aperçu de la séance du jour
- Derniers repas enregistrés
- Poids actuel vs objectif, jours restants

### 🍽️ Nutrition
- **Journal** : repas groupés par type (petit-déj, déjeuner, dîner, collation)
- **Ajout manuel** : formulaire inline avec nom, quantité, kcal, macros
- **Scanner IA** : photo → DeepSeek Vision → identification des aliments → sliders de portion → ajout au journal
- **Recherche** : base d'aliments avec ajout en un clic
- **✨ Plan repas IA** : DeepSeek génère un plan du jour adapté à tes macros cibles

### 💪 Workout
- Programme généré par IA lors de l'onboarding, sauvegardé dans Supabase
- Chargement automatique de la séance du jour (pas de régénération)
- Checkboxes persistées (état sauvegardé)
- Mode séance active : timer, navigation entre exercices, compteur de séries

### 📊 Progress
- Graphique de poids (Recharts LineChart) avec courbe de tendance
- Graphique calories 7 jours (BarChart)
- Log poids quotidien
- **Check-in hebdomadaire** avec Adaptive Progression Engine

### 🧠 Adaptive Progression Engine
- Analyse multi-facteurs : poids, fatigue, sommeil, performance, adhérence, motivation
- Ajustements automatiques : calories, macros, volume, intensité, repos
- Détection de stagnation, surentraînement, décharge
- Résultats sauvegardés dans `weekly_checkins`

### 🤖 Coach IA (Chat)
- DeepSeek Chat avec contexte utilisateur injecté (profil, macros, stats du jour)
- Suggestions rapides : "Ma journée", "Plan repas", "Suppléments", "Exercices"
- Conversation persistée dans Supabase

### 👤 Profil
- Édition du nom inline
- Cibles quotidiennes affichées
- Modales centrées : Notifications (toggles), Confidentialité (RGPD), Aide & Support (lien chat IA, email, version)
- Déconnexion

---

## 🛠 Stack technique

| Couche | Technologie |
|---|---|
| **Frontend** | React 19, TypeScript, TanStack Router, TanStack Query, Tailwind CSS v4, shadcn/ui |
| **Backend** | Express.js, TypeScript, tsx |
| **Base de données** | Supabase (PostgreSQL + Auth + RLS) |
| **IA** | DeepSeek API (Vision + Chat) |
| **State** | Zustand, React Query |
| **Charts** | Recharts |
| **Build** | Vite, Cloudflare Workers (SSR) |
| **Lint** | ESLint, Prettier |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + Vite + TanStack Start)       │
│  Port: 5173 (dev) · Servi par Express (prod)    │
├─────────────────────────────────────────────────┤
│  Backend API (Express.js)                       │
│  Port: 5000                                     │
│  /api/auth · /api/profile · /api/food-logs ...   │
├─────────────────────────────────────────────────┤
│  Supabase                                       │
│  Auth · PostgreSQL · RLS · Row-Level Security   │
├─────────────────────────────────────────────────┤
│  DeepSeek API                                   │
│  Vision (scan repas) · Chat (coach IA)          │
│  Génération programme sportif                   │
└─────────────────────────────────────────────────┘
```

---

## 📦 Installation

```bash
# Cloner le projet
git clone <repo-url>
cd fitflow-ai

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Éditer .env.local avec tes clés Supabase et DeepSeek
```

---

## 🔑 Variables d'environnement

Fichier `.env.local` :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_DEEPSEEK_API_KEY=sk-...
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000
```

---

## 🗄️ Base de données

Exécute le fichier `supabase_schema.sql` dans Supabase > SQL Editor. Il crée :

| Table | Description |
|---|---|
| `profiles` | Profil utilisateur (objectif, mode, poids, macros) |
| `food_logs` | Journal alimentaire |
| `weight_logs` | Historique de poids |
| `workout_sessions` | Programme sportif (séances + exercices en JSONB) |
| `chat_messages` | Conversations avec le Coach IA |
| `daily_targets` | Cibles macros quotidiennes |
| `weekly_checkins` | Check-ins hebdomadaires (Adaptive Engine) |

**RLS activé sur toutes les tables** — chaque utilisateur voit uniquement ses données.

**Trigger `handle_new_user()`** — crée automatiquement un profil à l'inscription.

### Configuration Supabase OAuth (Google)

1. [Google Cloud Console](https://console.cloud.google.com) → Créer un OAuth client ID (Web)
2. **Redirect URI** : `https://xxxxx.supabase.co/auth/v1/callback`
3. Supabase > Authentication > Providers > Google → Coller Client ID + Secret
4. **URL Configuration** : ajouter `http://localhost:5173/**` aux Redirect URLs

---

## 🚀 Démarrage

```bash
# Développement (frontend + API)
npm run dev

# API uniquement
npm run api

# Production
npm run build
npm start        # Express sert tout sur le port 5000
```

---

## 🔌 API Backend

| Route | Méthode | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | ❌ | Inscription email |
| `/api/auth/login` | POST | ❌ | Connexion email |
| `/api/auth/me` | GET | ✅ | Profil connecté |
| `/api/profile` | GET | ✅ | Profil utilisateur |
| `/api/profile/onboarding` | POST | ✅ | Sauvegarde onboarding |
| `/api/food-logs` | GET/POST | ✅ | Journal alimentaire |
| `/api/food-logs/:id` | DELETE | ✅ | Supprimer un aliment |
| `/api/weight-logs` | GET/POST | ✅ | Poids |
| `/api/workout-sessions` | GET/POST | ✅ | Séances |
| `/api/dashboard/stats` | GET | ✅ | Stats dashboard |
| `/api/ai/scan-food` | POST | ✅ | Scanner repas (Vision) |
| `/api/ai/generate-plan` | POST | ✅ | Générer plan IA |
| `/api/ai/chat` | POST | ✅ | Chat Coach IA |
| `/api/ai/chat/stream` | POST | ✅ | Chat streaming (SSE) |

---

## 📁 Structure du projet

```
fitflow-ai/
├── .env.local                    # Variables d'environnement
├── supabase_schema.sql           # SQL à exécuter dans Supabase
├── package.json                  # Scripts + dépendances
├── vite.config.ts                # Configuration Vite + TanStack
│
├── src/
│   ├── server/                   # API Express
│   │   ├── app.ts                # Config Express + routes
│   │   ├── index.ts              # Entry point (port 5000)
│   │   ├── config/env.ts         # Variables d'environnement serveur
│   │   ├── routes/               # Routes API (auth, profile, food, ai...)
│   │   ├── controllers/          # Contrôleurs
│   │   ├── services/             # Logique métier
│   │   ├── middleware/           # Auth, error, validation, rate-limit
│   │   └── lib/                  # Supabase, DeepSeek, calculations
│   │
│   ├── routes/                   # Pages (TanStack Router)
│   │   ├── __root.tsx            # Layout racine + auth guard
│   │   ├── index.tsx             # Dashboard
│   │   ├── login.tsx             # Connexion / Inscription
│   │   ├── onboarding.tsx        # Onboarding 4 étapes
│   │   ├── nutrition.tsx         # Journal + Scanner + Recherche
│   │   ├── workout.tsx           # Programme sportif
│   │   ├── progress.tsx          # Stats + Check-in + Adaptive Engine
│   │   ├── profile.tsx           # Profil + Paramètres
│   │   └── chat.tsx              # Coach IA
│   │
│   ├── hooks/                    # React hooks
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useFoodLog.ts
│   │   ├── useWorkout.ts
│   │   ├── useDashboard.ts
│   │   └── useChat.ts
│   │
│   ├── lib/                      # Bibliothèques partagées
│   │   ├── supabase.ts           # Client Supabase
│   │   ├── deepseek.ts           # Client DeepSeek
│   │   ├── ai-service.ts         # Service IA (plan, chat, scan)
│   │   ├── adaptive-engine.ts    # Moteur de progression adaptative
│   │   └── calculations.ts       # BMR, TDEE, macros
│   │
│   ├── components/               # Composants UI
│   │   ├── ui/                   # shadcn/ui
│   │   └── app/                  # AppShell, BottomNav, CalorieRing, MacroBar
│   │
│   ├── services/                 # API client + stores
│   │   ├── api.ts                # Fetch wrapper
│   │   ├── auth.service.ts
│   │   ├── dashboard.service.ts
│   │   └── food.service.ts
│   │
│   ├── stores/                   # Zustand
│   │   ├── auth.store.ts
│   │   └── dashboard.store.ts
│   │
│   ├── types/                    # Types TypeScript
│   │   └── database.types.ts
│   │
│   └── styles.css                # Tailwind + thème dark gym
```

---

## 🎨 Design System

- **Theme** : Dark gym — fond noir profond `#0D0D0D`
- **Accent** : Vert électrique `#00E5A0`
- **Secondaire** : Orange performance `#FF6B35`
- **Typographie** : Syne (display), DM Sans (body), JetBrains Mono (data)
- **Mobile-first** : 390px → 768px → 1280px

---

## 📄 Licence

MIT
