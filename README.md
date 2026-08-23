# RelicVault AI

> A crowdsourced digital heritage & minor-artifact museum. Upload a photo, drop a pin, and a vision model turns it into a structured archive entry in under a minute.

If the Louvre gets the masterpieces, **RelicVault gets everything else** — village heirlooms, family keepsakes, flea-market finds, the cultural artifacts that are under-protected or already forgotten.

**Stack:** Next.js 14 (App Router) · TypeScript · MongoDB / Mongoose · Zhipu GLM `glm-4v-flash` (vision) · OpenStreetMap Nominatim + Leaflet (geocoding & maps) · Tailwind + shadcn/ui · 3-language UI (zh-CN / zh-TW / en).

---

## Highlights

- **Photo → structured record in one click.** Upload an image; the form is auto-filled with title, dynasty / era, category, material, preservation status, and short tags — all from a strict JSON-prompt vision call.
- **Privacy-by-default geocoding.** Coordinates entered on the map are auto-blurred before storage: 2 decimals (~±550 m) for ordinary finds, 1 decimal (~±5.5 km) for protected sites. Exact coordinates never leave the server.
- **Searchable, filterable Explore page.** Fuzzy title search, `#tag` search, era / category / preservation-status filters, and a grid-or-map toggle. Likes, favorites, and comments are first-class on each artifact.
- **Personal profile & contributions.** Stats dashboard, editable profile card, full CRUD on every artifact you uploaded.
- **Three languages, one UI.** Simplified Chinese, Traditional Chinese, and English — driven by the `rv_locale` cookie. The vision model also returns results in the user's language when you ask it to.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14.2 (App Router, Node runtime, edge-safe route handlers) |
| Language | TypeScript 5.7 (strict) |
| Database | MongoDB via Mongoose 9 (single source of truth for users, artifacts, likes, favorites, comments) |
| Auth | Email + password, bcrypt hashes, **JWT session cookies** (`rv_session`, `jose` HS256, 7-day expiry, `httpOnly` + `sameSite=lax`) |
| Vision provider | [Zhipu GLM](https://open.bigmodel.cn) `glm-4v-flash` — OpenAI-compatible Chat Completions, China-direct, free tier, JSON-mode output. Pluggable via `AI_PROVIDER` env (`zhipu` default, `siliconflow` reserved, `gemini` deprecated) |
| Geocoding | [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) — keyless, free |
| Maps | Leaflet 1.9 + react-leaflet 4.2, OSM tiles |
| UI | Tailwind 3 + shadcn/ui (Radix UI primitives), `lucide-react` icons, Radix Toast for notifications |
| Validation | Zod 3 + React Hook Form 7 |
| Tests | Vitest 4 |

The `openai` JS SDK still appears in `package.json` because `@supabase/ssr` depends on it transitively, but **no application code calls OpenAI**. The visual pipeline goes through `src/lib/vision/zhipu.ts`.

---

## Quick start

### Prerequisites
- **Node.js** ≥ 18.17 (project tested on 22.x)
- **MongoDB** running locally on `mongodb://localhost:27017` (or set `MONGODB_URI` to a remote cluster)
- A **Zhipu GLM** API key (free): https://open.bigmodel.cn → 控制台 → API Keys

### Setup

```bash
git clone https://github.com/raywang7266/RelicVault-AI.git
cd RelicVault-AI
npm install
cp .env.example .env.local        # then edit .env.local (see below)
npm run dev
```

Open http://localhost:3000 and sign up. The first account can immediately start uploading artifacts.

### Seed demo data (optional)

`scripts/seed-artifacts-mongo.js` inserts ~12 sample artifacts into your local Mongo and prints credentials for a demo `curator` account.

```bash
node scripts/seed-artifacts-mongo.js
```

The script is **idempotent**: it skips artifacts that the `curator` user already owns.

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run typecheck` | `tsc --noEmit` strict check |

---

## Environment variables

Copy `.env.example` → `.env.local` and fill in:

| Var | Required? | Purpose |
|-----|-----------|---------|
| `MONGODB_URI` | **Yes** | MongoDB connection string (e.g. `mongodb://localhost:27017/relicvault`) |
| `SESSION_SECRET` | **Yes** | HMAC-SHA256 secret used to sign the session JWT (any random string ≥ 32 chars) |
| `AI_PROVIDER` | optional, default `zhipu` | Pick the vision provider: `zhipu` (default) / `siliconflow` (reserved) / `gemini` (deprecated) |
| `ZHIPU_API_KEY` | required when `AI_PROVIDER=zhipu` | API key from open.bigmodel.cn |
| `ZHIPU_MODEL` | optional, default `glm-4v-flash` | Override the model id |
| `NEXT_PUBLIC_APP_URL` | optional, default `http://localhost:3000` | Used for canonical links & share URLs |
| `SILICONFLOW_API_KEY` | reserved | Only needed if you implement that provider |
| `GEMINI_API_KEY` | reserved | Gemini is **disabled** (Google services are unreachable from the deployment region) |

Legacy Supabase and OpenAI keys can stay in `.env.local` for reference — they are no longer consulted by any code path.

---

## How it works

### 1 · Sign up & sign in
- Email + password → `bcryptjs` hash → user row in Mongo `users` collection.
- On success, `signSession(userId)` returns a JWT signed with `SESSION_SECRET` (HS256, 7-day expiry). The browser stores it as the `rv_session` cookie: `httpOnly`, `sameSite=lax`, `secure` in production. The client never sees the token.

### 2 · Submit an artifact (`/artifacts/new`)
- The user picks a photo, types/edits an era, category, preservation status, description, manual tags, optionally types a place name or drops a pin on the OSM map.
- Clicking **AI analyze** sends a `data:` URL of the photo + the current UI locale to `POST /api/analyze-artifact`.
- That route calls `createVisionProvider().analyzeArtifact(...)` (Zhipu GLM `glm-4v-flash`) with a strict system prompt that:
  - outputs exactly one JSON object — no prose, no markdown;
  - pins `category` to one of six fixed Chinese terms (so the Explore filter is stable);
  - pins `preservationStatus` to one of four English enums;
  - fills unclear fields with the current-language word for **"unknown"** instead of guessing;
  - tells the model which UI language to use for `title` / `era` / `description` / `tags`.
- The form auto-fills from the JSON, the user reviews, and submits.

### 3 · Persist & publish (`POST /api/artifacts`)
- Server-side zod validation + 5 req / 60s rate limit per IP.
- The artifact row is written with the **exact** coordinates; a Mongoose `pre('save')` hook computes `blurredLat` / `blurredLng` automatically (2 decimals normal, 1 decimal if `isProtected`).
- The Explore page never receives exact coordinates.

### 4 · Browse, like, comment (`/explore`, `/artifacts/[id]`)
- One `GET /api/artifacts` request with `q`, `tag`, `dynasty`, `material`, `status`, `limit` params — the server applies them in Mongo and returns the matches.
- Likes, favorites, and comments live on the artifact document itself, so a single read serves the whole detail view.

### 5 · Profile (`/profile`)
- `getServerUser()` server-side guard.
- Stats (uploads, total likes received, days joined), editable profile card, and a "My Contributions" grid with edit/delete.

---

## Architecture at a glance

```
┌──────────┐    ┌────────────┐    ┌─────────────────────┐    ┌──────────┐    ┌───────────────┐
│  Photo   │ →  │ Upload form│ →  │ Zhipu GLM glm-4v-   │ →  │  Mongo   │ →  │ Explore /     │
│  (data:  │    │ (Leaflet   │    │ flash  +  Nominatim │    │  Mongoose│    │ Profile       │
│   URL)   │    │  picker)   │    │  (JSON-mode prompt) │    │  models  │    │ (likes,       │
└──────────┘    └────────────┘    └─────────────────────┘    └──────────┘    │  favorites,   │
                                                                            │  comments)    │
                                                                            └───────────────┘
```

Green step = AI vision (Zhipu GLM). Teal step = geocoding (OSM Nominatim). Grey steps = plain data.

---

## Project layout

```
polymercaptial/
├── public/                         # Static assets
├── scripts/
│   └── seed-artifacts-mongo.js     # Idempotent demo-data seeder
├── src/
│   ├── actions/                    # Server Actions (mutations)
│   ├── app/
│   │   ├── (auth)/                 # No nav: login, register, callback
│   │   ├── (main)/                 # With navbar/footer: dashboard, explore,
│   │   │                             profile, artifacts/new
│   │   ├── api/                    # Route handlers
│   │   │   ├── analyze-artifact/   # POST — vision analysis (Zhipu GLM)
│   │   │   ├── artifacts/          # GET/POST artifact list & submit
│   │   │   ├── upload/             # POST — reserved (501 Not Implemented)
│   │   │   ├── login | register | logout | me | profile
│   │   │   ├── favorites/          # Toggle favorite on an artifact
│   │   │   └── ai/                 # Reserved AI helpers
│   │   ├── gallery/                # Public gallery
│   │   ├── globals.css             # Tailwind layers + global animations
│   │   └── layout.tsx              # Root HTML shell + Toaster
│   ├── components/
│   │   ├── ai/                     # AI-analyze button / preview
│   │   ├── artifacts/              # Upload form, Explore grid, location picker
│   │   ├── auth/                   # Auth forms
│   │   ├── layout/                 # Navbar, footer, locale switcher
│   │   ├── profile/                # Profile view + edit modal
│   │   └── ui/                     # shadcn/ui primitives, toast
│   ├── hooks/                      # Client React hooks
│   ├── lib/
│   │   ├── auth/                   # jwt, session, password hashing, rate limit
│   │   ├── vision/                 # Vision provider factory + Zhipu adapter
│   │   ├── store/                  # Mongoose-backed store (artifacts)
│   │   ├── mock/                   # Browser-local mock for likes/comments
│   │   ├── i18n/                   # zh-CN / zh-TW / en dictionaries
│   │   ├── openai/                 # Legacy client (kept for back-compat)
│   │   ├── gemini/                 # Deprecated adapter
│   │   ├── security/               # CSRF / sanitization helpers
│   │   └── mongodb.ts              # Mongoose connection singleton
│   ├── models/                     # Mongoose schemas (User, Artifact)
│   ├── schemas/                    # Zod request schemas
│   └── types/                      # Shared TypeScript types
├── supabase/                       # Legacy SQL migrations (no longer applied)
├── tests/                          # Vitest suites
└── tmp/                            # Scratch space (PDF generator, scripts)
```

---

## Data model (MongoDB / Mongoose)

### `users`
| Field | Type | Notes |
|-------|------|-------|
| `email` | string, unique | Login id |
| `password` | string \| null | bcrypt hash; `null` for OAuth-only users |
| `displayName` | string | Shown in UI |
| `username` | string, unique sparse | Optional handle |
| `role` | `"user" \| "admin"` | Default `user` |
| `bio`, `avatarUrl` | string | Editable from profile |
| `githubId` | string, sparse | Reserved for historical accounts |
| `favorites` | string[] | Cached favorite artifact ids |
| `createdAt` | Date | For "days joined" stat |

### `artifacts`
| Field | Type | Notes |
|-------|------|-------|
| `title`, `description`, `imageUrl` | string | `imageUrl` is a `data:` URL written directly from the form |
| `aiTags`, `manualTags` | string[] | Two buckets — AI suggests, human edits |
| `era`, `category`, `locationName` | string | AI-suggested / user-edited |
| `preservationStatus` | enum | `excellent` / `good` / `fair` / `poor` / `critical` / `unknown` (DB); mapped to `Intact / Minor Damage / Severe Degradation / Ruin` at the API edge |
| `exactLat/Lng` | number \| null | **Server-only**, never returned to clients |
| `blurredLat/Lng` | number \| null | Auto-computed in `pre('save')` (2 decimals, or 1 if `isProtected`) |
| `isProtected` | boolean | Tighter blur when `true` |
| `userId` | ObjectId → User | Indexed; ownership enforced at the API layer |
| `likes`, `favorites`, `comments` | mixed | First-class on the document so a single read serves the detail view |
| `createdAt` | Date | For sort + stat |

A Mongoose `pre('save')` hook guarantees that whenever `exactLat/Lng` are set, `blurredLat/Lng` are derived — so business code never has to remember to blur.

---

## Internationalization

- Locale is `zh-CN` (default), `zh-TW`, or `en`, persisted as the `rv_locale` cookie.
- A server-side helper `localeToZhipuLanguage(locale)` maps the UI locale to the language the vision prompt asks for.
- Three dictionaries live in `src/lib/i18n/locales.ts` (~860 lines). A locale switcher in the navbar writes the cookie.

---

## Roadmap

Already documented as "Future enhancements" in the project write-up:
- **Xiaohongshu-style social layer** — public profiles, follow graph, direct messages.
- **Richer uploads** — multiple images per artifact, short video, pure-text entries. (`/api/upload` is currently a 501 placeholder.)
- **Stronger auth** — third-party sign-in (Google / WeChat), email verification on sign-up, phone-number verification.
- **Image hosting** — move from inline `data:` URLs to object storage (S3-compatible) so larger photos don't blow up the document size.
- **Hardened moderation** — a reported-items queue and an admin review page; `role: "admin"` is already on the user schema.

---

## License

This is a personal portfolio / summer-project repository. If you'd like to use the code, please open an issue or contact me first.

## Contact

- GitHub: [@raywang7266](https://github.com/raywang7266)
- Repository: https://github.com/raywang7266/RelicVault-AI