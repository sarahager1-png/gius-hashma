# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
npm run dev          # dev server with Turbopack on localhost:3000
npm run build        # production build
npm run typecheck    # TypeScript check (no emit)
npm run lint         # ESLint
npm run format       # Prettier (ts, tsx)
```

No test suite exists in this project.

## Environment

Required `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

## Architecture

**Stack:** Next.js 16 (App Router), Supabase (auth + postgres), Tailwind CSS v4, shadcn/ui, TypeScript.

**Auth & routing:** `middleware.ts` guards all routes. Session via Supabase SSR cookies. Public paths: `/login`, `/register`, `/api/profile`.

**Supabase clients — two patterns:**
- `createClient()` — SSR client, respects RLS. Use for authenticated reads.
- `createServiceClient()` — service role, bypasses RLS. Use in API routes for writes.

**Route groups:**
- `app/(auth)/login/` — login page
- `app/(dashboard)/` — all protected pages (auth guard in layout)
- `app/register/` — public registration flow (3 paths: candidate / institution)
- `app/api/` — API routes for all mutations

**Data flow:** Pages = server components → fetch via `createClient()` → pass to `*-client.tsx` for interactivity. Mutations = API routes.

**Key files:**
- `lib/types.ts` — TypeScript interfaces (Profile, Candidate, Institution, Job, Application)
- `lib/constants.ts` — AVAILABILITY_STATUSES, JOB_STATUSES, JOB_TYPES, SPECIALIZATIONS, ACADEMIC_LEVELS, INSTITUTION_TYPES, status color maps
- `lib/server-utils.ts` — `assertRole()`, `assertAdmin()`, `getProfile()`
- `lib/utils.ts` — `cn()`, `formatDate()`
- `supabase/schema.sql` — full schema + RLS policies

**Styling:** Tailwind CSS v4. Brand colors: purple `#5B3AAB`, cyan `#00B4CC`, gold `#C9A84C`, bg `#F2F0F8`. RTL — all pages use `dir="rtl"`. Font: Rubik.

**Roles and access:**
- `מועמדת` — sees jobs, applies, manages own profile + applications
- `מוסד` — must be approved first; posts jobs, manages applications, searches candidates
- `מנהל רשת` / `אדמין מערכת` — approves institutions, sees all data, reports

**Database schema** is in `supabase/schema.sql`. Run migrations manually via Supabase SQL Editor.
