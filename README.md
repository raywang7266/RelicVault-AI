# RelicVault AI

A crowdsourced digital heritage and minor artifact museum powered by AI. Contributors submit photos of artifacts with tags and GPS coordinates; **Zhipu GLM** vision enriches submissions with `aiTags`; **MongoDB (Mongoose)** stores users, artifacts, likes, favorites, and comments. Exact coordinates are never returned to the client — the API only serves blurred coordinates to protect unprotected heritage sites.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (Radix UI) |
| Database | [MongoDB](https://www.mongodb.com/) via Mongoose |
| Auth | bcrypt password hashing + JWT session cookie (`jose`, httpOnly) |
| AI vision | [Zhipu GLM](https://open.bigmodel.cn) `glm-4v-flash` (China-direct, free tier) |
| Maps | OpenStreetMap Nominatim (geocoding) + Leaflet / react-leaflet |
| Validation | Zod + React Hook Form |
| Icons | Lucide React |

---

## Project Directory Structure

```
polymercaptial/
├── .github/
│   └── workflows/              # CI/CD pipelines (lint, typecheck, build)
│
├── Dockerfile                  # 3-stage production image (deps → build → run)
├── docker-compose.yml          # app + MongoDB stack (recommended way to run)
├── .dockerignore               # keeps node_modules/.next/secrets out of the image
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
| `mongodb.ts` | Singleton Mongoose connection (cached on `globalThis` so HMR doesn't leak connections). |
| `store/` | Data-access layer for artifacts & users (DTOs, ownership checks, demo seeding). |
| `models/` | Mongoose schemas — `User.ts`, `Artifact.ts`. |
| `vision/` | Vision provider factory + Zhipu GLM adapter (`glm-4v-flash`). |
| `auth/` | bcrypt hashing, JWT signing/verification (`jose`), session cookie helpers. |
| `constants.ts` | Single source of truth for categories, upload limits, app name. |
| `utils.ts` | Class name merging (`cn`) and small pure helpers. |

### `src/hooks/` — Client Hooks

Encapsulate API calls (`/api/me`, `/api/artifacts`, …) and React state for artifacts and the current user. Keeps page components thin.

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

Pick **one** of two ways to run the project:

| | Option A — Docker | Option B — Node + MongoDB |
|---|---|---|
| What you install | Docker Desktop only | Node.js ≥ 18.17 **and** MongoDB |
| Commands to get running | 2 | ~6 |
| Database | bundled (`mongo:7` container) | you run it yourself |

> **Option A is recommended** — it starts MongoDB *and* the app together, so there is no local database to install and nothing else to configure.

---

### Option A — Run everything with Docker (recommended)

#### Prerequisites

- **Docker Desktop** installed **and running** (Windows/macOS: <https://www.docker.com/products/docker-desktop/>). Verify with `docker ps` — if it prints a table (even empty), the daemon is up; if it says *"Cannot connect to the Docker daemon"*, open Docker Desktop first and wait for its tray icon to stop animating.
- **Your own Zhipu GLM API key** — see [Get a Zhipu GLM API key](#get-a-zhipu-glm-api-key-required). Not included in the repo.

#### Step 1 — create your `.env.local`

```bash
cp .env.example .env.local
```

Open it and fill in two values:

```bash
# Any long random string — generate one with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
SESSION_SECRET=paste-a-long-random-string-here

# Your own Zhipu key (required for AI image analysis)
ZHIPU_API_KEY=your-key.your-secret
```

> Everything else can stay as-is. In particular **you do not need to change `MONGODB_URI`** — `docker-compose.yml` overrides it to `mongodb://mongo:27017/relicvault` automatically, because inside Docker the database lives at the service name `mongo`, not `localhost`.

#### Step 2 — build & start the stack

```bash
docker compose up -d --build
```

- First run takes **4–8 minutes** (pulls `node:22-slim` + `mongo:7`, installs dependencies, compiles Next.js). Later runs are seconds thanks to layer caching.
- `--build` = rebuild the image (use it whenever you change code).
- `-d` = detached, so you keep your terminal.

#### Step 3 — open the app

**<http://localhost:3000>** → you land on the login page. Register an account, or sign in with the demo account below.

| Service | URL / Port | Notes |
|---------|-----------|-------|
| Next.js app | <http://localhost:3000> | the website |
| MongoDB | `mongodb://localhost:27018` (container port 27017) | port **27018** on purpose — 27017 is usually taken by a locally installed `mongod` |

#### Everyday commands

```bash
docker compose ps                  # status of both containers
docker compose logs -f app         # follow app logs (Ctrl+C to quit)
docker compose logs -f mongo       # follow database logs
docker compose restart app         # restart after editing .env.local
docker compose up -d --build       # rebuild + restart after editing code
docker compose down                # stop everything (data is KEPT)
docker compose down -v             # stop everything and DELETE the database
docker compose exec mongo mongosh  # open a Mongo shell inside the container
```

> **Changed `.env.local`?** The app reads env vars at container start, and `.env.local` is *not* copied into the image — so a plain `docker compose restart app` is enough. Use `up -d --build` only for **code** changes.

> **Where does my data live?** In the named Docker volume `relicvault-mongo-data`. `docker compose down` keeps it; only `down -v` deletes it.

---

### Option B — Run with Node + MongoDB directly

Only pick this if you don't want Docker.

1. Install **Node.js ≥ 18.17** and **MongoDB** (local server, or a free [Atlas](https://www.mongodb.com/cloud/atlas/register) cluster).
2. Ensure MongoDB is listening on `mongodb://localhost:27017`, then:

```bash
cp .env.example .env.local   # fill SESSION_SECRET + ZHIPU_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Collections and indexes are created automatically on first run — there is **no migration step**.

---

### Environment Variables

Set in `.env.local` (also read by `docker compose` via `env_file`):

| Variable | Required? | Description |
|----------|-----------|-------------|
| `MONGODB_URI` | **Yes** | Mongo connection string. Local: `mongodb://localhost:27017/relicvault` — **Docker overrides this automatically** to `mongodb://mongo:27017/relicvault` |
| `SESSION_SECRET` | **Yes** | Random string used to sign the JWT session cookie. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ZHIPU_API_KEY` | **Yes** | Your own Zhipu key — powers AI image analysis. See below |
| `AI_PROVIDER` | optional, default `zhipu` | `zhipu` (default) / `siliconflow` (reserved) / `gemini` (deprecated) |
| `ZHIPU_MODEL` | optional, default `glm-4v-flash` | Override the vision model |
| `NEXT_PUBLIC_APP_URL` | optional, default `http://localhost:3000` | Canonical URL for share links |

> Supabase / OpenAI keys may still sit in `.env.local` for reference — **no code reads them anymore**. The vision pipeline runs on Zhipu GLM, and storage/auth run on MongoDB.

### Get a Zhipu GLM API key (required)

AI image analysis calls **Zhipu GLM `glm-4v-flash`** through the [Zhipu Open Platform](https://open.bigmodel.cn). **Each user must apply for their own key (~2 minutes, free):**

1. Sign up / log in at <https://open.bigmodel.cn> (phone or email; new accounts get free tokens).
2. Complete **real-name verification** (实名认证) if prompted.
3. Open the console → **API Keys** (direct link: <https://open.bigmodel.cn/usercenter/apikeys>).
4. Click **创建 API Key**, name it anything, then **copy it** — it is shown only once.
5. Paste it into `.env.local` as `ZHIPU_API_KEY=...`.
6. Restart: `docker compose restart app` (or restart `npm run dev`).

**If you skip it:** the site still runs — browsing, login, exploring all work — but clicking **"AI 分析"** on the upload form fails with `未配置 ZHIPU_API_KEY`. You can still fill the form manually, but the AI feature is dead.

**Cost:** `glm-4v-flash` is permanently free on Zhipu's platform.

### Demo data (seeded automatically)

On the **very first read against an empty database**, the app inserts 12 sample artifacts owned by a demo `curator` account. The dataset ships in code (`src/lib/store/demo-data.ts`) with fixed titles, tags, images, and creation dates, so **every install sees identical demo content**.

Skip registration and log in with:

| Field | Value |
|-------|-------|
| email | `curator@relicvault.app` |
| password | `RelicVault@2026` |

The seeder is idempotent — it runs only when the demo account is missing, so deleting demo artifacts never triggers a re-insert. (`node scripts/seed-artifacts-mongo.js` does the same thing manually.)

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot connect to the Docker daemon` | Start Docker Desktop and wait until it reports *running* |
| `port is already allocated` (27017 / 3000) | Another process owns the port. Stop your local `mongod`, or change the host side in `docker-compose.yml` (e.g. `"27019:27017"`) |
| `Conflict. The container name "/relicvault-mongo" is already in use` | A container from an earlier `docker run` still exists: `docker rm -f relicvault-mongo`, then `docker compose up -d` |
| Upload form shows `未配置 ZHIPU_API_KEY` | `ZHIPU_API_KEY` missing or wrong in `.env.local`; fix it then `docker compose restart app` |
| Login button bounces you to `/explore` | Stale session cookie from an older database. Hard-refresh (Ctrl+Shift+R), or clear the `rv_session` cookie |
| Fresh DB shows nothing | Hit <http://localhost:3000/explore> once — auto-seeding runs on first read |

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server (hot reload) at <http://localhost:3000> |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run typecheck` | `tsc --noEmit` |

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js App     │────▶│  MongoDB    │
│  (React)    │◀────│  (RSC + Actions) │◀────│  (Mongoose) │
└─────────────┘     └────────┬─────────┘     └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │ Zhipu GLM   │
                      │ glm-4v-flash│
                      │ (Analysis)  │
                      └─────────────┘
```

With Docker, the app and MongoDB run as two containers on a private network:

```
localhost:3000 ──▶ relicvault-app  ──(mongo:27017)──▶ relicvault-mongo
                        │                                   │
                        └──── relicvault-mongo-data ◀───────┘  (named volume, persists data)
```

1. **Browse** — `(main)/explore` reads artifacts via `src/lib/store/artifacts.ts`; the API layer (`/api/artifacts`) only ever returns blurred coordinates.
2. **Submit** — Contributors upload a photo, then insert a document into the `artifacts` collection with `exactLat` / `exactLng`.
3. **Blur** — The store layer computes `blurredLat` / `blurredLng` on every write; exact coordinates are never serialized to the client.
4. **Analyze** — `/api/analyze-artifact` sends the image to Zhipu GLM; results are stored as `aiTags` plus suggested title / era / category / description.

---

## Data Model

Schema definitions live in `src/models/` and are applied by Mongoose at runtime (no migrations):

- **`src/models/User.ts`** — `username`, `email`, `passwordHash` (bcrypt), `displayName`, `avatarUrl`, `bio`, `role`, timestamps.
- **`src/models/Artifact.ts`** — `title`, `description`, `imageUrl`, `aiTags[]`, `manualTags[]`, `era`, `category`, `locationName`, `preservationStatus`, `exactLat` / `exactLng` (sensitive, server-only), `blurredLat` / `blurredLng`, `isProtected`, `userId`, `likes[]`, `favorites[]`, `comments[]`, `createdAt`.

### GPS coordinate protection

| Audience | What they see | How |
|----------|---------------|-----|
| Any client (anonymous or logged in) | `blurredLat`, `blurredLng` | The DTO layer never serializes `exactLat` / `exactLng` |
| Server | All fields | Used internally for maps and ownership checks |

Blur precision:

- **Standard site** — rounded to 2 decimal places (~1.1 km)
- **Protected site** (`isProtected = true`) — rounded to 1 decimal place (~11 km)

---

## Legacy: Supabase schema (historical — no longer used)

> The project originally ran on Supabase PostgreSQL. Those tables and RLS policies are kept below for reference only; **no application code reads them now.**

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

Contributors attach **manual tags** at submission time; clicking **"AI 分析"** calls Zhipu GLM, which writes **`aiTags`** plus suggested metadata. There is no fixed category enum — discovery is tag-driven.

Upload limit: **10 MB** per image. Accepted formats: JPEG, PNG, WebP.

---

## License

Private — all rights reserved unless otherwise specified.
