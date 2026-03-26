# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:migrate   # Run new migrations (prompts for migration name)
npm run db:studio    # Open Prisma Studio GUI to inspect data
```

There is no test suite.

## Architecture

Single-page Next.js 15 app (App Router) with a SQLite database via Prisma. All UI lives on the root route `/`.

**Data flow:**
1. `src/app/page.tsx` (server component) — fetches all data from Prisma at request time, serializes dates to ISO strings, passes hydrated initial state to the client component
2. `src/app/SupplementsClient.tsx` (client component) — owns all UI state (modals, editing, optimistic updates) using `useState`/`useTransition`
3. `src/app/actions.ts` (server actions) — all database mutations go here; each action calls `revalidatePath('/')` to trigger re-fetch after mutations

No API routes. Mutations go directly through server actions to Prisma.

## Database Schema

Four models:

- **Supplement** — a supplement product with inventory tracking. `packageUnits` is a JSON-encoded array of integers (units remaining per package). `startDate` marks when supplementation began, used to calculate automatic daily deductions.
- **Person** — a person taking supplements.
- **SupplementPerson** — junction table linking persons to supplements with per-person settings (`takingDaily`, `unitsPerDay`).
- **SkippedIntake** — records a manually skipped day for a specific person+supplement combination. The calendar uses this to differentiate active, partial, and skipped days.

After editing `prisma/schema.prisma`, always run `npm run db:generate` to update the Prisma client, and `npm run db:migrate` to apply changes to the database.

## Key Patterns

- **Optimistic updates:** mutations are wrapped in `startTransition` so the UI feels immediate; the server revalidation updates state in the background.
- **Date serialization:** Prisma returns `Date` objects which can't cross the server→client boundary. `page.tsx` converts them to ISO strings; client code parses them back with `new Date()`.
- **packageUnits JSON:** stored as a string in SQLite; parse with `JSON.parse()` and stringify before saving. Represents units remaining per individual package (array length = number of packages).
- **Daily deduction logic:** happens at 10pm via a calculation based on `startDate` and the number of days elapsed. Skipped days reduce the count by subtracting the supplement's `unitsPerDay` back.
