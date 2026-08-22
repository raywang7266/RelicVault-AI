# RelicVault AI

A crowdsourced digital heritage and minor artifact museum powered by AI. Contributors submit photos of artifacts with tags and GPS coordinates; OpenAI enriches submissions with `ai_tags`; Supabase stores users, artifacts, and media. Exact coordinates are never exposed to non-admin users — the database auto-computes blurred coordinates to protect unprotected heritage sites.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (Radix UI) |
| Database & Auth | [Supabase](https://supabase.com/) (PostgreSQL, RLS, Storage) |
| AI | [OpenAI API](https://platform.openai.com/) |
| Validation | Zod + React Hook Form |
| Icons | Lucide React |

---

## Project Directory Structure

```
polymercaptial/
├── .github/
│   └── workflows/              # CI/CD pipelines (lint, typecheck, build)
│
├── public/                     # Static assets served at the site root
│   └── images/                 # Placeholder images, logos, OG assets
│
├── src/
│   ├── actions/                # Next.js Server Actions (mutations)
│   │   ├── artifacts.ts        # Create, update, delete artifacts
│   │   └── auth.ts             # Sign in, sign up, sign out
│   │
│   ├── app/                    # App Router — routes, layouts, API
│   │   ├── (auth)/             # Auth route group (no shared chrome)
│   │   │   ├── callback/       # OAuth / magic-link callback handler
│   │   │   ├── login/          # Login page
│   │   │   └── register/       # Registration page
│   │   │
│   │   ├── (main)/             # Authenticated app shell (header + footer)
│   │   │   ├── artifacts/      # Artifact listing & detail
│   │   │   │   ├── [id]/       # Single artifact view
│   │   │   │   └── new/        # Submission form
│   │   │   ├── dashboard/      # Contributor dashboard
│   │   │   ├── explore/        # Public browse / search
│   │   │   ├── profile/        # User profiles
│   │   │   │   └── [username]/ # Dynamic profile by username
│   │   │   └── layout.tsx      # Shared layout for main routes
│   │   │
│   │   ├── api/                # Route Handlers (REST-style endpoints)
│   │   │   ├── ai/
│   │   │   │   └── analyze/    # POST — run OpenAI analysis on an artifact
│   │   │   ├── artifacts/      # GET/POST — artifact CRUD
│   │   │   └── upload/         # POST — image upload to Supabase Storage
│   │   │
│   │   ├── globals.css         # Global styles & CSS variables
│   │   ├── layout.tsx          # Root HTML shell & metadata
│   │   └── page.tsx            # Landing / home page
│   │
│   ├── components/             # React components
│   │   ├── ai/                 # AI analysis UI (panels, badges, loading)
│   │   ├── artifacts/          # Cards, grids, detail views, submission form
│   │   ├── auth/               # Login / register forms
│   │   ├── layout/             # Header, footer, navigation
│   │   └── ui/                 # shadcn/ui primitives (Button, Dialog, …)
│   │
│   ├── hooks/                  # Client-side React hooks
│   │   ├── use-artifacts.ts    # Fetch & cache artifact data
│   │   └── use-user.ts         # Current session / profile state
│   │
│   ├── lib/                    # Shared utilities & service clients
│   │   ├── openai/
│   │   │   └── client.ts       # OpenAI SDK singleton
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser Supabase client
│   │   │   ├── server.ts       # Server Component / Action client
│   │   │   └── middleware.ts   # Session refresh for middleware
│   │   ├── constants.ts        # App-wide constants (categories, limits)
│   │   └── utils.ts            # cn(), formatters, helpers
│   │
│   ├── schemas/                # Zod validation schemas
│   │   └── artifact.ts         # Artifact submission & update shapes
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── ai-analysis.ts      # OpenAI response shapes
│   │   ├── artifact.ts         # Domain models
│   │   ├── database.ts         # Hand-written Supabase row types
│   │   └── database.generated.ts  # Auto-generated Supabase types (gitignored until generated)
│   │
│   └── middleware.ts           # Auth guard, session refresh, redirects
│
├── supabase/                   # Database & local Supabase CLI config
│   ├── migrations/             # Versioned SQL schema changes
│   │   └── 001_initial_schema.sql
│   └── seed.sql                # Dev seed data (optional)
│
├── tests/                      # Unit & integration tests (Vitest / Playwright)
│   ├── unit/
│   └── e2e/
│
├── docs/                       # Extended documentation, ADRs, diagrams
│
├── .env.example                # Environment variable template
├── .gitignore
├── components.json             # shadcn/ui configuration
├── next.config.mjs             # Next.js configuration
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

> **Note:** Folders marked with comments like `tests/` and `.github/workflows/` are recommended additions for a production-ready repo. Core application code lives under `src/` and `supabase/`.

---

## Key Folder Roles

### Root

| Folder / File | Role |
|---------------|------|
| `public/` | Static files (images, favicons) referenced directly by URL. Not processed by the bundler. |
| `.github/workflows/` | Automated checks on push/PR — lint, typecheck, build, optional deploy. |
| `.env.example` | Documents required secrets without committing real values. |
| `components.json` | shadcn/ui alias paths and Tailwind integration settings. |
| Config files (`next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`) | Framework, styling, and compiler settings. |

### `src/app/` — Routing & Pages

Next.js App Router maps folders to URLs. Route groups `(auth)` and `(main)` organize layouts without affecting the URL path.

| Path | Role |
|------|------|
| `(auth)/` | Unauthenticated flows — login, register, OAuth callback. Minimal layout. |
| `(main)/` | Primary app experience with shared header/footer. |
| `explore/` | Public gallery for browsing approved artifacts. |
| `artifacts/` | List, detail (`[id]`), and new submission pages. |
| `dashboard/` | Signed-in contributor overview (submissions, status). |
| `profile/[username]/` | Public contributor profile and their artifacts. |
| `api/` | Server-side HTTP handlers for uploads, AI analysis, and REST endpoints. |

### `src/components/` — UI Layer

| Folder | Role |
|--------|------|
| `ui/` | Low-level, reusable primitives from shadcn/ui (Button, Input, Dialog). |
| `layout/` | Site chrome — navigation, footer, page shells. |
| `auth/` | Authentication forms and related UI. |
| `artifacts/` | Domain-specific presentation — cards, grids, detail panels, submission wizard. |
| `ai/` | Displays AI analysis results, loading states, and re-analyze actions. |

### `src/actions/` — Server Actions

Colocated server-side mutations callable from Client Components without writing API routes. Used for form submissions (auth, artifact create/update) with automatic revalidation.

### `src/lib/` — Infrastructure

| Folder | Role |
|--------|------|
| `supabase/` | Three clients — browser, server (cookies), and middleware — for correct SSR auth. |
| `openai/` | OpenAI client initialization and shared prompt helpers. |
| `constants.ts` | Single source of truth for categories, upload limits, app name. |
| `utils.ts` | Class name merging (`cn`) and small pure helpers. |

### `src/hooks/` — Client Hooks

Encapsulate Supabase queries and React state for artifacts and the current user. Keeps page components thin.

### `src/schemas/` & `src/types/`

| Folder | Role |
|--------|------|
| `schemas/` | Runtime validation (Zod) shared by forms, actions, and API routes. |
| `types/` | Compile-time TypeScript interfaces for domain models and DB rows. |

### `supabase/` — Backend Schema

| Path | Role |
|------|------|
| `migrations/` | Ordered SQL files applied to PostgreSQL. Source of truth for tables, indexes, RLS policies. |
| `seed.sql` | Optional dev/test fixture data. |

Core tables:

- **`profiles`** — User metadata (username, avatar, bio, role), linked 1:1 to `auth.users`.
- **`artifacts`** — Submitted items with image, tags, era, preservation status, and GPS coordinates.
- **`artifacts_public`** (view) — Privacy-safe read surface; returns blurred coordinates for non-admins.

### `tests/` & `docs/`

| Folder | Role |
|--------|------|
| `tests/unit/` | Fast tests for schemas, utilities, and pure functions. |
| `tests/e2e/` | Browser tests for critical flows (login, submit artifact, explore). |
| `docs/` | Architecture decisions, API notes, deployment runbooks. |

---

## Getting Started

### Prerequisites

- Node.js **≥ 18.17**
- npm (or pnpm / yarn)
- A [Supabase](https://supabase.com/) project
- An [OpenAI](https://platform.openai.com/) API key

### Installation

```bash
# Clone and enter the project
cd polymercaptial

# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env.local
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **server only**, never expose to the client |
| `OPENAI_API_KEY` | OpenAI API key for artifact analysis |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (e.g. `http://localhost:3000`) |

### Database Setup

```bash
# Apply migrations to your Supabase project (via Supabase CLI)
supabase db push

# Optional: load seed data
supabase db seed

# Regenerate TypeScript types from your schema
npm run db:types
```

### Development

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Run production build locally
npm run lint     # ESLint
npm run typecheck # TypeScript without emit
```

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js App     │────▶│  Supabase   │
│  (React)    │◀────│  (RSC + Actions) │◀────│  (DB/Auth/  │
└─────────────┘     └────────┬─────────┘     │   Storage)  │
                             │               └─────────────┘
                             ▼
                      ┌─────────────┐
                      │   OpenAI    │
                      │  (Analysis) │
                      └─────────────┘
```

1. **Browse** — `(main)/explore` reads artifacts via the `artifacts_public` view (blurred GPS for non-admins).
2. **Submit** — Contributors upload images via `/api/upload`, then insert rows into `artifacts` with `exact_lat` / `exact_lng`.
3. **Blur** — A database trigger auto-computes `blurred_lat` / `blurred_lng` on every insert/update.
4. **Analyze** — `/api/ai/analyze` sends the image to OpenAI; results are stored in `artifacts.ai_tags`.

---

## Database Schema

Migration file: `supabase/migrations/001_initial_schema.sql`

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | References `auth.users(id)` |
| `username` | `text` unique | 3–30 chars, alphanumeric + `_-` |
| `display_name` | `text` | Optional display name |
| `avatar_url` | `text` | Profile image URL |
| `bio` | `text` | Short biography |
| `role` | `user_role` | `user` (default) or `admin` |
| `created_at` | `timestamptz` | Auto-set on insert |

A trigger on `auth.users` auto-creates a profile row on signup.

### `artifacts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | Auto-generated |
| `title` | `text` | Required |
| `description` | `text` | Optional narrative |
| `image_url` | `text` | Required — primary photo |
| `ai_tags` | `text[]` | Tags from OpenAI analysis |
| `manual_tags` | `text[]` | Contributor-supplied tags |
| `era` | `text` | Historical period |
| `preservation_status` | enum | `excellent` · `good` · `fair` · `poor` · `critical` · `unknown` |
| `exact_lat` | `float8` | **Admin-only** — precise latitude |
| `exact_lng` | `float8` | **Admin-only** — precise longitude |
| `blurred_lat` | `float8` | Auto-computed safe latitude |
| `blurred_lng` | `float8` | Auto-computed safe longitude |
| `is_protected` | `boolean` | Coarser blur when `true` (~11 km vs ~1.1 km) |
| `created_at` | `timestamptz` | Auto-set on insert |
| `user_id` | `uuid` FK | Owner → `profiles(id)` |

### GPS coordinate protection

| Audience | What they see | How |
|----------|---------------|-----|
| Anonymous / regular user | `blurred_lat`, `blurred_lng` | Query `artifacts_public` → `display_lat`, `display_lng` |
| Admin | `exact_lat`, `exact_lng` | Same view returns exact values when `profiles.role = 'admin'` |
| Server (service role) | All columns on base table | Backend jobs, migrations, admin tooling |

Blur precision (via `blur_coordinates()`):

- **Standard site** — rounded to 2 decimal places (~1.1 km)
- **Protected site** (`is_protected = true`) — rounded to 1 decimal place (~11 km)

Direct `SELECT` on the `artifacts` base table is revoked for `anon` and `authenticated` roles so exact coordinates cannot leak through the Supabase Data API.

### Row Level Security (RLS)

**`profiles`**

| Policy | Operation | Rule |
|--------|-----------|------|
| Profiles are viewable by everyone | `SELECT` | Always allowed |
| Users can update their own profile | `UPDATE` | `auth.uid() = id` (cannot change own `role`) |

**`artifacts`**

| Policy | Operation | Rule |
|--------|-----------|------|
| Artifacts are viewable by everyone | `SELECT` | Always allowed (base table — service role only) |
| Authenticated users can insert their own artifacts | `INSERT` | `auth.uid() = user_id` |
| Users can update their own artifacts | `UPDATE` | `auth.uid() = user_id` |
| Users can delete their own artifacts | `DELETE` | `auth.uid() = user_id` |

Client reads should use the **`artifacts_public`** view, which is granted to both `anon` and `authenticated`.

---

## Conventions

- **Imports:** Use `@/` path alias (maps to `src/`).
- **Components:** Prefer Server Components; add `"use client"` only when hooks or browser APIs are needed.
- **Forms:** React Hook Form + Zod schemas from `src/schemas/`.
- **Styling:** Tailwind utility classes; design tokens in `globals.css`.
- **New UI primitives:** `npx shadcn@latest add <component>` — outputs to `src/components/ui/`.
- **New migrations:** Add numbered SQL files under `supabase/migrations/`; never edit applied migrations in place.

---

## Tags & Upload Limits

Contributors attach **manual tags** at submission time; OpenAI writes **ai tags** after analysis. There is no fixed category enum — discovery is tag-driven.

Upload limit: **10 MB** per image. Accepted formats: JPEG, PNG, WebP.

---

## License

Private — all rights reserved unless otherwise specified.
