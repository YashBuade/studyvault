# StudyVault

StudyVault is a production-ready full-stack student workspace built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL
- HTTP-only cookie authentication
- lucide-react icons
- Vercel-ready deployment configuration

## Features

- Secure sign up, login, and logout with HTTP-only cookies
- Middleware-based protection for dashboard routes
- Polished dark/light theme toggle with localStorage persistence
- Single dashboard sidebar layout (`app/dashboard/layout.tsx`)
- 10 structured dashboard modules:
  - Dashboard
  - Notes
  - My Files
  - Upload Center
  - Assignments
  - Planner
  - Resources
  - Exams
  - Profile
  - Settings
- Notes CRUD (create, list, delete) persisted in PostgreSQL via Prisma
- User-scoped file upload, listing, and secure download APIs
- Responsive design for mobile, tablet, and desktop

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/studyvault?sslmode=require"
# Optional (recommended for Prisma migrations/introspection on some hosts)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/studyvault?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Run migrations:

```bash
npm run prisma:migrate
```

4. Start development server:

```bash
npm run dev
```

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the repo into Vercel.
3. Configure `DATABASE_URL` (and optionally `DIRECT_URL`) plus `AUTH_SECRET` in Vercel Project Settings.
4. Deploy.

No GitHub Pages-specific logic is used.
