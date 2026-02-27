# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests (Vitest)
npm run test:watch   # Tests in watch mode
npm run test -- src/lib/date.test.ts   # Run a single test file
```

## Architecture

**Cade's Clubhouse** is a Next.js 16 App Router project (React 19, TypeScript strict, Tailwind CSS 4) deployed on Vercel. It's a kid-friendly app that shows daily AI-generated George Washington facts paired with Star Wars analogies and DALL-E-3 illustrations.

### Key Layers

- **Pages** (`src/app/`): App Router pages — homepage (`page.tsx`) and `/archive`
- **Components** (`src/components/`): `ClubhouseScene` manages view state transitions (clubhouse → loading → facts) triggered by triple-click. Child views: `ClubhouseView`, `FactsView`, `LoadingView`, `ArchiveList`
- **API Routes** (`src/app/api/`):
  - `daily-fact` GET — returns today's fact (cached 5min), falls back to yesterday, then generates on-demand
  - `generate-daily-fact` POST — cron-triggered (6 AM via Vercel cron), protected by `CRON_SECRET` bearer token
  - `fact-image/[date]` GET — serves stored images with 24h immutable cache
  - `archive` GET — paginated list (10/page)
- **Database** (`src/lib/db.ts`): Turso/libSQL with single `daily_facts` table. Falls back to `file:local.db` when `TURSO_DATABASE_URL` is not set
- **AI** (`src/lib/prompts.ts`): GPT-4o-mini for fact text, DALL-E-3 for images (1024x1024 base64 PNG stored in DB)
- **Date handling** (`src/lib/date.ts`): All dates use America/Chicago (Central Time)

### Environment Variables

- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — database connection
- `OPENAI_API_KEY` — AI generation
- `CRON_SECRET` — protects the generate endpoint

### Testing Patterns

Tests use Vitest + @testing-library/react + jsdom. API route tests mock `src/lib/db` and `openai`. The `@` path alias resolves to `./src`. Test files live next to source files (e.g., `route.test.ts` alongside `route.ts`).
