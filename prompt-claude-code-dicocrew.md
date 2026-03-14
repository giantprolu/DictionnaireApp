# Prompt Claude Code — DicoCrew : Dictionnaire Collaboratif PWA

## 🎯 Projet

Crée une **PWA Next.js** (App Router) appelée **DicoCrew** — un dictionnaire collaboratif entre potes. Les utilisateurs rejoignent des groupes via invitation (lien ou code), et chacun peut ajouter des mots, expressions, private jokes avec leur définition perso. Les autres membres réagissent, votent, commentent, et proposent des définitions alternatives. L'app capture l'argot et le vocabulaire unique de chaque groupe de potes.

**URL de production** : `https://dictionnaire.trouve-tout-conseil.fr`

---

## Stack technique

- **Framework** : Next.js 14+ (App Router, Server Actions, Server Components)
- **BDD** : PostgreSQL via Prisma ORM (Prisma Accelerate)
- **Auth** : NextAuth.js v5 (Auth.js) — credentials (email/password avec bcrypt)
- **Styling** : Tailwind CSS + design mobile-first PWA
- **PWA** : next-pwa ou @serwist/next (manifest.json, service worker, installable)
- **Déploiement** : Vercel avec domaine custom `dictionnaire.trouve-tout-conseil.fr`

---

## Variables d'environnement (.env)

```env
# Base de données
DATABASE_URL="postgres://0d4e7e26f69252d2c6b2790eb03ee04de1775b8742e2f1fc815332824d45479a:sk_NWSJA8ImXDXHG1pRpa_c8@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL="postgres://0d4e7e26f69252d2c6b2790eb03ee04de1775b8742e2f1fc815332824d45479a:sk_NWSJA8ImXDXHG1pRpa_c8@db.prisma.io:5432/postgres?sslmode=require"
PRISMA_DATABASE_URL="postgres://0d4e7e26f69252d2c6b2790eb03ee04de1775b8742e2f1fc815332824d45479a:sk_NWSJA8ImXDXHG1pRpa_c8@db.prisma.io:5432/postgres?sslmode=require"

# Auth
NEXTAUTH_SECRET="generate-a-random-secret-here-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://dictionnaire.trouve-tout-conseil.fr"

# App
NEXT_PUBLIC_APP_URL="https://dictionnaire.trouve-tout-conseil.fr"
NEXT_PUBLIC_APP_NAME="DicoCrew"
```

---

## Schéma Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  password      String
  avatar        String?   // URL ou emoji/initiales comme avatar
  bio           String?   // petite bio fun
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  memberships   GroupMember[]
  words         Word[]
  definitions   Definition[]
  reactions     Reaction[]
  comments      Comment[]
  invitesSent   Invite[]       @relation("InviteSender")
  votes         Vote[]
  achievements  UserAchievement[]
}

model Group {
  id            String    @id @default(cuid())
  name          String
  description   String?
  emoji         String?   @default("📖") // emoji identifiant du groupe
  code          String    @unique // code d'invitation unique (8 chars alphanum)
  isPublic      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  members       GroupMember[]
  words         Word[]
  invites       Invite[]
  wordOfTheDay  WordOfTheDay[]
}

model GroupMember {
  id        String   @id @default(cuid())
  role      Role     @default(MEMBER)
  nickname  String?  // surnom dans le groupe (optionnel)
  joinedAt  DateTime @default(now())

  userId    String
  groupId   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId])
}

enum Role {
  ADMIN
  MEMBER
}

model Word {
  id          String    @id @default(cuid())
  term        String
  phonetic    String?   // prononciation fun optionnelle ex: "[bor-dèl-de-mèrd]"
  origin      String?   // origine / contexte du mot ("Soirée chez Kévin, 3h du mat")
  isNSFW      Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  authorId    String
  groupId     String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  group       Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)

  definitions  Definition[]
  reactions    Reaction[]
  comments     Comment[]
  tags         TagOnWord[]
  wordOfTheDay WordOfTheDay[]

  @@unique([term, groupId]) // un mot unique par groupe
  @@index([groupId, createdAt])
  @@index([groupId, term])
}

model Definition {
  id          String   @id @default(cuid())
  content     String
  example     String?  // exemple d'utilisation dans une phrase
  isOriginal  Boolean  @default(true) // définition de l'auteur du mot vs alternative
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  authorId    String
  wordId      String
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  word        Word       @relation(fields: [wordId], references: [id], onDelete: Cascade)

  reactions   Reaction[]
  votes       Vote[]
}

model Vote {
  id           String   @id @default(cuid())
  value        Int      // +1 ou -1 (upvote/downvote)
  createdAt    DateTime @default(now())

  userId       String
  definitionId String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  definition   Definition @relation(fields: [definitionId], references: [id], onDelete: Cascade)

  @@unique([userId, definitionId])
}

model Reaction {
  id        String   @id @default(cuid())
  emoji     String   // "👍", "😂", "🤔", "❤️", "🔥", "💀", "🤡", "💯"
  createdAt DateTime @default(now())

  userId       String
  wordId       String?
  definitionId String?
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  word         Word?       @relation(fields: [wordId], references: [id], onDelete: Cascade)
  definition   Definition? @relation(fields: [definitionId], references: [id], onDelete: Cascade)

  @@unique([userId, wordId, emoji])
  @@unique([userId, definitionId, emoji])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId  String
  wordId    String
  parentId  String?  // réponse à un autre commentaire (thread)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  word      Word     @relation(fields: [wordId], references: [id], onDelete: Cascade)
  parent    Comment? @relation("CommentThread", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentThread")
}

model Tag {
  id    String      @id @default(cuid())
  name  String      @unique // "nourriture", "insulte-affectueuse", "soirée", "gaming", etc.
  color String?     // couleur hex pour affichage

  words TagOnWord[]
}

model TagOnWord {
  wordId String
  tagId  String
  word   Word @relation(fields: [wordId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([wordId, tagId])
}

model WordOfTheDay {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  
  wordId    String
  groupId   String
  word      Word     @relation(fields: [wordId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([groupId, date]) // un seul mot du jour par groupe par date
}

model Invite {
  id        String       @id @default(cuid())
  status    InviteStatus @default(PENDING)
  email     String?
  createdAt DateTime     @default(now())
  expiresAt DateTime?    // expiration optionnelle

  senderId  String
  groupId   String
  sender    User         @relation("InviteSender", fields: [senderId], references: [id], onDelete: Cascade)
  group     Group        @relation(fields: [groupId], references: [id], onDelete: Cascade)
}

enum InviteStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

model Achievement {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String
  emoji       String   // "🏆", "📝", "🔥", etc.
  threshold   Int      // nombre requis pour débloquer

  users       UserAchievement[]
}

model UserAchievement {
  id           String   @id @default(cuid())
  unlockedAt   DateTime @default(now())

  userId       String
  achievementId String
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement  Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
}
```

---

## Fonctionnalités — CRUD complet + features sociales

### Auth (NextAuth.js v5 credentials)
- `POST /api/auth/register` — inscription (email, username, password)
- Sign in / Sign out via NextAuth
- Middleware de protection des routes (`/(app)/*`)
- Session accessible côté serveur et client
- Page profil : modifier username, bio, avatar (choix parmi des emojis ou initiales colorées)

### Groupes
- **Créer** un groupe (nom, description, emoji) — auto-génère un code d'invitation 8 chars
- **Rejoindre** un groupe via code OU via lien direct `https://dictionnaire.trouve-tout-conseil.fr/join/CODE`
- **Lister** ses groupes (dashboard avec stats : nb mots, nb membres, dernier mot ajouté)
- **Voir** un groupe et ses mots
- **Modifier** nom/description/emoji (admin only)
- **Supprimer** un groupe (admin only, avec confirmation)
- **Quitter** un groupe
- **Gérer les membres** : voir la liste avec rôle et date d'arrivée, retirer un membre (admin), promouvoir admin

### Mots / Expressions
- **Ajouter** un mot + sa définition initiale + exemple + prononciation fun (optionnel) + origine/contexte (optionnel) + tags
- **Lister** les mots du groupe avec filtres et tris :
  - Alphabétique (A-Z, Z-A)
  - Par date (récent, ancien)
  - Par popularité (plus réagi)
  - Par tag
  - Toggle NSFW (masqué par défaut, révélé au tap)
- **Rechercher** un mot dans le groupe (recherche instantanée avec debounce)
- **Voir** un mot avec toutes ses définitions, réactions, commentaires
- **Modifier** son propre mot
- **Supprimer** son propre mot (ou admin du groupe)
- **Partager** un mot : copier un lien direct vers le mot, ou générer une image/card à partager

### Définitions
- **Ajouter** une définition alternative à un mot existant
- **Voter** pour/contre une définition (upvote/downvote style Reddit)
- **Modifier** sa propre définition
- **Supprimer** sa propre définition
- Les définitions sont triées par score de votes (meilleure en premier)

### Réactions
- **Réagir** à un mot ou une définition (emojis : 👍 😂 🤔 ❤️ 🔥 💀 🤡 💯)
- **Retirer** sa réaction (toggle)
- Afficher le compteur de réactions agrégé avec animation bounce

### Commentaires (threaded)
- **Commenter** un mot
- **Répondre** à un commentaire (threads à 1 niveau)
- **Supprimer** son propre commentaire
- Affichage chronologique avec indentation des réponses

### Invitations & Partage
- **Lien d'invitation** : `https://dictionnaire.trouve-tout-conseil.fr/join/{CODE}` — page publique qui montre le nom du groupe + nb membres + bouton rejoindre
- **Copier le code** en un tap
- **Partager via Web Share API** (natif sur mobile : SMS, WhatsApp, etc.)
- **QR Code** généré côté client pour le lien d'invitation (lib: qrcode.react)

---

## 🎮 Features fun entre potes

### Mot du Jour
- Chaque groupe a un **mot du jour** sélectionné aléatoirement parmi les mots du groupe
- Affiché en hero sur la page du groupe avec une card mise en valeur
- Change automatiquement chaque jour (cron-like via revalidation ou check côté serveur)
- Historique consultable

### Statistiques & Leaderboard du groupe
- **Top contributeurs** : classement par nombre de mots ajoutés
- **Top définitions** : les plus votées du groupe
- **Mot le plus réagi** : le mot qui a le plus de réactions
- **Membre le plus actif** cette semaine/ce mois
- Stats globales du groupe : total mots, total définitions, total réactions, membre depuis X jours

### Système d'achievements / Badges
Seeds à insérer en base :
```
🏆 "Premier Mot"        — Ajouter son premier mot (threshold: 1)
📝 "Lexicographe"       — Ajouter 10 mots (threshold: 10)
📚 "Encyclopédiste"     — Ajouter 50 mots (threshold: 50)
🔥 "En Feu"             — Ajouter un mot 5 jours consécutifs (threshold: 5)
💬 "Bavard"             — Écrire 20 commentaires (threshold: 20)
👍 "Critique"           — Voter 50 fois (threshold: 50)
🤡 "Bouffon Officiel"   — Avoir un mot avec 10+ réactions 💀 (threshold: 10)
❤️ "Coup de Coeur"      — Avoir une définition avec 10+ upvotes (threshold: 10)
🎯 "Sniper"             — Proposer une définition alternative qui dépasse l'originale en votes (threshold: 1)
👥 "Rassembleur"        — Créer un groupe avec 10+ membres (threshold: 10)
```
- Toast/notification quand un achievement est débloqué
- Section badges sur le profil

### Mot Aléatoire
- Bouton "🎲 Mot aléatoire" dans le groupe — affiche un mot au hasard avec animation de shuffle
- Fun pour redécouvrir d'anciens mots

### Mode Quiz (optionnel mais cool)
- Un mot du groupe est affiché, 4 définitions proposées (1 vraie + 3 fausses d'autres mots), il faut trouver la bonne
- Score affiché, mode solo pour le fun

### Export du dictionnaire
- Bouton "📥 Exporter" qui génère un PDF ou fichier texte stylisé avec tous les mots du groupe triés par ordre alphabétique
- Format dictionnaire classique avec le terme en gras, la prononciation en italique, les définitions numérotées

### Notifications in-app
- Fil de notifications simple (stocké en mémoire ou via polling) :
  - "X a ajouté le mot 'Y' dans le groupe Z"
  - "X a réagi à ton mot 'Y'"
  - "X a proposé une définition alternative pour 'Y'"
  - "Tu as débloqué le badge 🏆 Premier Mot !"
- Pastille rouge sur l'icône notifications dans la navbar

---

## Structure de fichiers attendue

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx              // liste des groupes + stats rapides
│   │   ├── profile/page.tsx                // profil utilisateur + badges
│   │   ├── notifications/page.tsx          // fil de notifications
│   │   ├── groups/
│   │   │   ├── new/page.tsx                // créer un groupe
│   │   │   ├── join/page.tsx               // rejoindre via code (formulaire)
│   │   │   └── [groupId]/
│   │   │       ├── page.tsx                // vue groupe (mot du jour + liste mots)
│   │   │       ├── settings/page.tsx       // paramètres groupe (admin)
│   │   │       ├── members/page.tsx        // gestion membres
│   │   │       ├── stats/page.tsx          // leaderboard + stats du groupe
│   │   │       ├── quiz/page.tsx           // mode quiz
│   │   │       ├── export/route.ts         // export PDF/texte
│   │   │       └── words/
│   │   │           ├── new/page.tsx        // ajouter un mot
│   │   │           └── [wordId]/page.tsx   // détail mot (défs, réactions, comments)
│   │   └── layout.tsx                      // layout app avec bottom nav
│   ├── join/
│   │   └── [code]/page.tsx                 // page publique d'invitation (pas besoin d'être connecté pour voir)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── register/route.ts
│   │   └── og/[wordId]/route.tsx           // Open Graph image dynamique pour partage
│   ├── manifest.ts                         // manifest PWA dynamique (Next.js metadata)
│   ├── layout.tsx                          // root layout + meta + viewport
│   └── page.tsx                            // landing page publique
├── components/
│   ├── ui/                                 // Button, Input, Card, Modal, Badge, Toast, Skeleton, Sheet
│   ├── words/                              // WordCard, WordList, AddWordForm, WordOfTheDay, RandomWord
│   ├── groups/                             // GroupCard, GroupList, InviteLink, QRCode
│   ├── definitions/                        // DefinitionCard, AddDefinitionForm, VoteButtons
│   ├── reactions/                          // ReactionBar, ReactionButton (avec animation)
│   ├── comments/                           // CommentThread, CommentForm
│   ├── stats/                              // Leaderboard, AchievementBadge, StatCard
│   ├── quiz/                               // QuizCard, QuizResult
│   └── layout/                             // Navbar, BottomNav, Header, NotificationBell
├── lib/
│   ├── prisma.ts                           // singleton Prisma (compatible Vercel serverless)
│   ├── auth.ts                             // config NextAuth v5
│   ├── actions/                            // Server Actions
│   │   ├── auth.ts
│   │   ├── groups.ts
│   │   ├── words.ts
│   │   ├── definitions.ts
│   │   ├── reactions.ts
│   │   ├── votes.ts
│   │   ├── comments.ts
│   │   ├── achievements.ts
│   │   └── notifications.ts
│   ├── utils.ts                            // generateCode(), formatDate(), cn(), etc.
│   ├── validators.ts                       // Schémas Zod centralisés
│   └── achievements.ts                     // logique de vérification des achievements
├── hooks/
│   ├── useDebounce.ts
│   ├── useInstallPrompt.ts                 // PWA install prompt
│   └── useNotifications.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                             // seed achievements + tags par défaut
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   └── screenshots/                        // screenshots PWA pour manifest
└── middleware.ts                            // auth redirect middleware
```

---

## Configuration Vercel & Domaine

### next.config.js
```js
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  images: {
    remotePatterns: [],
  },
});
```

### Manifest PWA (src/app/manifest.ts)
```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DicoCrew — Dictionnaire entre potes',
    short_name: 'DicoCrew',
    description: 'Le dictionnaire collaboratif de ta bande de potes',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#0A0A0B',
    orientation: 'portrait',
    categories: ['social', 'entertainment', 'education'],
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

### Root Layout Meta (src/app/layout.tsx)
```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://dictionnaire.trouve-tout-conseil.fr'),
  title: { default: 'DicoCrew', template: '%s | DicoCrew' },
  description: 'Le dictionnaire collaboratif de ta bande de potes',
  openGraph: {
    title: 'DicoCrew',
    description: 'Crée le dictionnaire de ton groupe de potes',
    url: 'https://dictionnaire.trouve-tout-conseil.fr',
    siteName: 'DicoCrew',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DicoCrew',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}
```

### Prisma singleton (compatible Vercel serverless)
```ts
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Vercel settings
- **Build command** : `prisma generate && next build`
- **Environment variables** : copier toutes les variables du .env dans les settings Vercel
- **Domain** : `dictionnaire.trouve-tout-conseil.fr` — configurer le CNAME chez le registrar vers `cname.vercel-dns.com`

---

## Design & UX — Mobile-first PWA

### Direction artistique
- **Thème** : Dark mode par défaut avec option light mode. Ambiance "dictionnaire urbain" / "groupe de potes"
- **Couleurs dark** : fond noir profond (#0A0A0B), surfaces (#141416), cartes (#1C1C1F), bordures (#2A2A2E), accents néon vert menthe (#34D399) pour les CTA, violet (#A78BFA) pour les highlights, texte principal (#F5F5F5), texte secondaire (#888)
- **Couleurs light** : fond crème/warm white (#FAFAF8), surfaces (#FFFFFF), accents identiques mais ajustés
- **Typo display** pour les mots : monospace distinctif (JetBrains Mono, Space Mono, ou Fira Code) — les mots doivent ressembler à des entrées de dictionnaire
- **Typo body** : DM Sans ou Satoshi — clean et lisible
- **Cards** : bords arrondis (12-16px), glassmorphism léger en dark mode (backdrop-blur + border subtle), ombre douce en light mode
- **Bottom navigation** : 4 onglets avec icônes + labels — 📖 Dico, 🔍 Chercher, ➕ Ajouter, 👤 Profil
- **Animations** :
  - Réactions : scale bounce (0.8 → 1.2 → 1.0) + petit shake
  - Transitions entre pages : fade + slide up subtil
  - Skeleton loaders sur toutes les listes
  - Confetti ou sparkle quand un achievement est débloqué
  - Shuffle animation sur le mot aléatoire (les lettres changent rapidement puis se stabilisent)
- **Empty states** fun : illustrations ou emojis + texte d'humour quand une liste est vide ("Aucun mot encore... C'est vide comme le vocabulaire de Kévin 🫠")

### PWA Requirements
- `manifest.ts` complet (voir ci-dessus)
- Service worker pour le cache offline des pages visitées
- Meta tags iOS : `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`
- Apple touch icon
- Bouton "Installer l'app" intelligent avec hook `useInstallPrompt` (cache le bouton si déjà installé ou si le navigateur ne supporte pas)
- Splash screen iOS via meta tags apple-touch-startup-image

### Page de partage de mot (/join/[code] et OG image)
- La page `/join/[code]` est **publique** (pas besoin d'être connecté) : elle montre le nom du groupe, son emoji, le nombre de membres, et un bouton "Rejoindre" qui redirige vers login si non connecté
- Route API `/api/og/[wordId]` qui génère une **Open Graph image dynamique** (via `next/og` ImageResponse) pour le partage social : affiche le mot, sa définition, le nom du groupe — quand quelqu'un partage un mot sur WhatsApp/iMessage, ça affiche une jolie preview card

---

## Seed de données initiales (prisma/seed.ts)

```ts
// Achievements
const achievements = [
  { code: 'FIRST_WORD', name: 'Premier Mot', description: 'Ajouter son premier mot', emoji: '🏆', threshold: 1 },
  { code: 'LEXICOGRAPHER', name: 'Lexicographe', description: 'Ajouter 10 mots', emoji: '📝', threshold: 10 },
  { code: 'ENCYCLOPEDIST', name: 'Encyclopédiste', description: 'Ajouter 50 mots', emoji: '📚', threshold: 50 },
  { code: 'ON_FIRE', name: 'En Feu', description: 'Ajouter un mot 5 jours de suite', emoji: '🔥', threshold: 5 },
  { code: 'CHATTERBOX', name: 'Bavard', description: 'Écrire 20 commentaires', emoji: '💬', threshold: 20 },
  { code: 'CRITIC', name: 'Critique', description: 'Voter 50 fois', emoji: '👍', threshold: 50 },
  { code: 'CLOWN', name: 'Bouffon Officiel', description: 'Avoir un mot avec 10+ 💀', emoji: '🤡', threshold: 10 },
  { code: 'HEARTTHROB', name: 'Coup de Coeur', description: 'Avoir une déf avec 10+ upvotes', emoji: '❤️', threshold: 10 },
  { code: 'SNIPER', name: 'Sniper', description: 'Déf alternative qui bat l\'originale', emoji: '🎯', threshold: 1 },
  { code: 'GATHERER', name: 'Rassembleur', description: 'Créer un groupe avec 10+ membres', emoji: '👥', threshold: 10 },
];

// Tags par défaut
const tags = [
  { name: 'insulte-affectueuse', color: '#EF4444' },
  { name: 'private-joke', color: '#F59E0B' },
  { name: 'soirée', color: '#8B5CF6' },
  { name: 'nourriture', color: '#10B981' },
  { name: 'gaming', color: '#3B82F6' },
  { name: 'expression', color: '#EC4899' },
  { name: 'verlan', color: '#6366F1' },
  { name: 'onomatopée', color: '#F97316' },
  { name: 'inclassable', color: '#6B7280' },
];
```

---

## Règles de développement

1. **Server Actions** pour toutes les mutations (pas de routes API sauf auth + OG image)
2. **Validation Zod** sur chaque Server Action — schémas centralisés dans `lib/validators.ts`
3. **Gestion d'erreurs** : try/catch partout, retours typés `{ success: boolean, data?: T, error?: string }`
4. **Middleware auth** : redirection vers `/login` si non authentifié sur les routes `/(app)/*`
5. **Optimistic UI** pour les réactions et votes (useOptimistic)
6. **Loading states** : Suspense + skeleton loaders sur chaque page/liste
7. **Responsive** : mobile-first (320px minimum), utilisable sur desktop
8. **Accessibilité** : labels, aria-labels, focus-visible, rôles ARIA sur les éléments interactifs
9. **TypeScript strict** : pas de `any`, types Prisma inférés, interfaces explicites
10. **Revalidation** : `revalidatePath()` après chaque mutation
11. **SEO** : metadata dynamique par page (titre du groupe, mot, etc.)
12. **Sécurité** : vérifier que l'utilisateur est membre du groupe avant toute action sur ce groupe, vérifier l'ownership avant edit/delete
13. **Prisma best practices** : select/include explicites (pas de `findMany` sans filtre), pagination cursor-based si listes longues
14. **Vercel-compatible** : pas de `fs`, pas de state global côté serveur, Prisma singleton

---

## Commandes d'initialisation

```bash
npx create-next-app@latest dicocrew --typescript --tailwind --eslint --app --src-dir
cd dicocrew
npm install prisma @prisma/client next-auth@beta bcryptjs zod qrcode.react
npm install -D @types/bcryptjs @types/qrcode.react
npm install next-pwa
npx prisma init
# Copier le schema.prisma
# Copier le .env avec les bonnes variables
npx prisma db push
npx prisma generate
npx prisma db seed  # après avoir configuré le seed dans package.json
```

Ajouter dans `package.json` :
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## Priorité d'implémentation

1. **Setup** : Prisma schema + `db push` + seed achievements/tags
2. **Auth** : register + login + middleware + session + profil basique
3. **Groupes** : créer, rejoindre (code + lien `/join/[code]`), lister, voir, settings, quitter
4. **Mots + Définitions** : CRUD complet, recherche, filtres, tri
5. **Réactions + Votes** : toggle réactions, upvote/downvote définitions, optimistic UI
6. **Commentaires** : ajout, threads (réponses), suppression
7. **Social features** : mot du jour, mot aléatoire, leaderboard, stats du groupe
8. **Achievements** : logique de vérification, déblocage, affichage profil, toast
9. **Partage** : Web Share API, QR code, lien d'invitation, OG image dynamique
10. **PWA** : manifest, service worker, install prompt, meta iOS, offline basique
11. **UI/UX polish** : animations, transitions, empty states, dark/light mode toggle
12. **Quiz** (bonus si le temps le permet)

---

Lance-toi. Commence par le setup complet puis implémente feature par feature dans l'ordre de priorité. Chaque feature doit être fonctionnelle et testable avant de passer à la suivante. Le code doit être propre, typé, et prêt pour la production sur Vercel. Montre-moi le résultat à chaque étape.
