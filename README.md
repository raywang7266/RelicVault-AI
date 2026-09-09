# RelicVault AI

A crowdsourced digital heritage museum powered by AI. Contributors upload a photo of an artifact, Zhipu GLM vision suggests a title / era / category / description and auto-tags it, and the entry is stored in MongoDB together with GPS coordinates. Exact coordinates are **never** returned to the client — the API only serves blurred ones, so unprotected heritage sites cannot be pinpointed.

- 🖼️ **AI-assisted submission** — one click fills in title, era, category, description and tags from a photo
- 🔍 **Explore** — masonry waterfall grid with fuzzy name search, `#tag` search, and multi-facet filters (dynasty / material / condition)
- 🗺️ **Maps** — pick an excavation site with Leaflet, reverse-geocode via OpenStreetMap Nominatim
- 🔒 **Coordinate blurring** — exact coordinates stay server-side; public API returns 2-decimal (~1.1 km) or 1-decimal (~11 km for protected sites) values
- ❤️ **Social layer** — likes, favorites, and comments
- 🌐 **3 languages** — 简体中文 / 繁體中文 / English

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router, RSC + Route Handlers) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (Radix UI) |
| Database | [MongoDB](https://www.mongodb.com/) via Mongoose |
| Auth | bcrypt password hashing + JWT in an httpOnly cookie (`jose`) |
| AI vision | [Zhipu GLM](https://open.bigmodel.cn) `glm-4v-flash` (China-direct, free tier) |
| Maps / geocoding | Leaflet + react-leaflet, OpenStreetMap [Nominatim](https://nominatim.org/) |
| Validation | Zod + React Hook Form |
| Containers | Docker / Docker Compose (MongoDB 7 + app) |

> Legacy `src/lib/supabase/`, `src/lib/openai/`, `src/lib/gemini/` files may still exist in the tree — **no application code reads them anymore.**

---

## Features

- **Crowdsourced artifact archive** — upload photos, let the multimodal AI (Zhipu GLM) auto-identify era, category and tags, then record folk relics & heritage.
- **Explore gallery** — search by name or `#tag`, filter by dynasty / category / preservation status; switch between a waterfall grid and a map view.
- **Personal profile** — view your contributions and favorites, edit your bio & avatar.
- **Social layer (小红书-style)** — the community features:
  - **Follow / unfollow** any user; visit their public profile at `/u/<id>` to see their collection.
  - **Explore "关注" feed** — a second tab on Explore shows only artifacts from people you follow, with a **followed-people avatar strip** at the top.
  - **Red-dot notifications** — a bell in the header shows unread activity; the Explore "关注" tab shows its own red dot when someone you follow posts a **new artifact**. Clicking the tab (or opening the bell) clears the relevant dot.
  - **Comments & replies** — one level of nested replies on every artifact, plus **comment likes**.
  - **Activity notifications** — you get notified when someone comments on / replies to your artifact, follows you, or posts a new artifact (if you follow them).
- **Demo data** is seeded automatically on first run so the gallery is never empty (see [Demo data](#demo-data-seeded-automatically)).

---

## Quick Start — with Docker (recommended)

Docker starts **both** the app and MongoDB, so there is no database to install and nothing else to configure.

```
        ┌─────────────────────────── Docker Compose ───────────────────────────┐
        │                                                                       │
 localhost:3000 ──▶  relicvault-app  ──── mongodb://mongo:27017 ──▶ relicvault-mongo
                     (Next.js prod)                                  (mongo:7)
                                                                        │
                                                        relicvault-mongo-data (volume)
        └───────────────────────────────────────────────────────────────────────┘
```

### 1. Prerequisites — check these first

**a) Docker Desktop is installed and actually running.**

```bash
docker ps
```

- ✅ Prints a table (even an empty one) → the daemon is up, continue.
- ❌ `Cannot connect to the Docker daemon` / `npipe ... not found` → **open Docker Desktop** (Start menu / desktop icon) and wait until the tray icon stops animating and shows *Running*. Re-run `docker ps` before continuing.

> Use `docker compose` (with a space, Compose V2). If your Docker is very old you may need `docker-compose` (hyphenated) instead.

**b) You have your own Zhipu GLM API key** — free, ~2 minutes, see [Get a Zhipu GLM API key](#get-a-zhipu-glm-api-key-required). It is **not** bundled with the repo.

That's it — you do **not** need Node.js or MongoDB installed on your machine.

### 2. Create your `.env.local`

The app container reads all its configuration from this file, so it **must exist before the first `docker compose up`** (otherwise Compose aborts with `env file .env.local not found`).

```bash
cp .env.example .env.local
```

Now open `.env.local` and set two values:

```bash
# 1) Any long random string. Generate one with:
#    node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#    (no Node? use any 40+ character random string)
SESSION_SECRET=paste-a-long-random-string-here

# 2) Your own Zhipu GLM key — required for AI image analysis
ZHIPU_API_KEY=your-key.your-secret
```

> **Do not change `MONGODB_URI`.** It defaults to `mongodb://localhost:27017/relicvault`, which is correct for a *local* (non-Docker) run. Under Docker, `docker-compose.yml` automatically overrides it with `mongodb://mongo:27017/relicvault` — inside the Compose network the database is reached by its **service name**, not `localhost`.

### 3. Build and start

```bash
docker compose up -d --build
```

- **First run: 4–8 minutes.** It pulls `node:22-slim` + `mongo:7`, runs `npm ci`, compiles Next.js, and exports the image.
- **Later runs: seconds** (Docker caches layers). Use the same command whenever you change code.
- `-d` = detached; you get your terminal back. Drop it if you want live logs in the foreground.

### 4. Verify it's up

```bash
docker compose ps
```

Expected:

```
NAME               STATUS                    PORTS
relicvault-app     Up 30 seconds             0.0.0.0:3000->3000/tcp
relicvault-mongo   Up 30 seconds (healthy)   0.0.0.0:27018->27017/tcp
```

Then open **<http://localhost:3000>**. You should land on the login page.

Quick smoke test from the shell:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login   # → 200
curl -s http://localhost:3000/api/artifacts | head -c 200              # → JSON with demo artifacts
```

### 5. Sign in

Either register a new account, or use one of the bundled demo accounts (created automatically on first run):

| Field | Value |
|-------|-------|
| email | `curator@relicvault.app` |
| password | `RelicVault@2026` |

**12 more demo collectors** (same password `RelicVault@2026`) are also seeded so you can test the social features (follow / following feed / red-dot notifications / comment interactions) with realistic data — each has an avatar, bio, artifacts and comments:

| email | Display name | Specialty |
|-------|--------------|-----------|
| `demo.qingci@relicvault.app` | 青瓷客·沈砚 | 宋元青瓷 |
| `demo.jinshi@relicvault.app` | 金石生·陆铭 | 青铜器 |
| `demo.hanmo@relicvault.app` | 翰墨斋·苏蕙 | 明清书画 |
| `demo.yuyun@relicvault.app` | 玉韫山房·何玉 | 玉器 |
| `demo.silu@relicvault.app` | 丝路拾遗·康宁 | 织物与钱币 |
| `demo.minjian@relicvault.app` | 民间守艺·周阿婆 | 民俗器物 |
| `demo.tongxiang@relicvault.app` | 铜香炉·童乡 | 铜炉与香事 |
| `demo.cixiu@relicvault.app` | 苏绣坊·卫红 | 苏绣与老绣片 |
| `demo.qiqi@relicvault.app` | 髹漆斋·齐修 | 大漆与剔红 |
| `demo.beiwei@relicvault.app` | 碑帖阁·魏之 | 汉魏碑帖拓片 |
| `demo.muyu@relicvault.app` | 木鱼庵·鱼幼 | 木雕与佛龛 |
| `demo.yinzhang@relicvault.app` | 篆刻铺·章明 | 寿山石印章 |

Typical test flow: log in as `curator@relicvault.app` → follow a collector on the Explore page → log in as that collector and upload a new artifact → back as curator, the Explore "关注" tab shows a red dot, plus a bell notification.

### Every day commands

| Command | What it does |
|---------|--------------|
| `docker compose up -d --build` | **Rebuild + restart** — use after changing **code** |
| `docker compose restart app` | Restart only — use after changing **`.env.local`** |
| `docker compose ps` | Status of both containers |
| `docker compose logs -f app` | Follow app logs (`Ctrl+C` to quit) |
| `docker compose logs -f mongo` | Follow database logs |
| `docker compose stop` / `start` | Pause / resume without removing containers |
| `docker compose down` | Stop and remove containers — **data is kept** |
| `docker compose down -v` | Stop **and delete the database volume** (full reset) |
| `docker compose exec mongo mongosh` | Open a Mongo shell inside the DB container |
| `docker compose exec app sh` | Open a shell inside the app container |

### Ports

| Service | Container port | Host port | Why this host port |
|---------|---------------|-----------|--------------------|
| Next.js app | 3000 | **3000** → <http://localhost:3000> | the website |
| MongoDB | 27017 | **27018** → `mongodb://localhost:27018` | 27017 is usually taken by a locally installed `mongod` |

To use a different host port, edit the `ports:` line in `docker-compose.yml`, e.g. `- "3001:3000"` or `- "27019:27017"`, then `docker compose up -d`.

### Where my data lives

In the named Docker volume **`relicvault-mongo-data`**. It survives `docker compose down`, container rebuilds, and image updates — only `docker compose down -v` removes it. The volume name is pinned in `docker-compose.yml` so it is reused even if you previously created data with a plain `docker run`.

Uploaded photos are stored inline as data URLs in the `artifacts` collection, so **no extra upload volume is needed**.

---

## Alternative — run without Docker

Use this only if you don't want Docker. You install and run everything yourself.

1. **Node.js ≥ 18.17** (project is tested on 22.x).
2. **MongoDB** listening on `mongodb://localhost:27017` — install MongoDB Community Server, or run just the database in Docker:
   ```bash
   docker run -d --name relicvault-mongo -p 27017:27017 -v relicvault-mongo-data:/data/db mongo:7
   ```
   …or use a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster and paste its URI into `MONGODB_URI`.
3. Start the app:
   ```bash
   cp .env.example .env.local   # fill SESSION_SECRET + ZHIPU_API_KEY
   npm install
   npm run dev                  # http://localhost:3000
   ```

Collections and indexes are created automatically on first run — **there is no migration step**.

---

## Environment Variables

Set in `.env.local`; `docker compose` passes the whole file to the app container (`env_file`), so secrets are never baked into the image.

| Variable | Required? | Description |
|----------|-----------|-------------|
| `SESSION_SECRET` | **Yes** | Signs the JWT session cookie. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ZHIPU_API_KEY` | **Yes** | Your own Zhipu key — powers AI image analysis ([how to get one](#get-a-zhipu-glm-api-key-required)) |
| `MONGODB_URI` | Yes (non-Docker) | `mongodb://localhost:27017/relicvault`. **Auto-overridden to `mongodb://mongo:27017/relicvault` under Docker** |
| `AI_PROVIDER` | optional, default `zhipu` | `zhipu` (default) · `siliconflow` (reserved) · `gemini` (deprecated) |
| `ZHIPU_MODEL` | optional, default `glm-4v-flash` | Override the vision model |
| `NEXT_PUBLIC_APP_URL` | optional, default `http://localhost:3000` | Canonical URL for share links / metadata |

> Supabase and OpenAI keys may sit in `.env.local` for reference — nothing reads them.

---

## Get a Zhipu GLM API key (required)

AI image analysis calls **Zhipu GLM `glm-4v-flash`** through the [Zhipu Open Platform](https://open.bigmodel.cn). Every user needs their own key — about 2 minutes, and free.

1. Sign up / log in at <https://open.bigmodel.cn> (phone or email; new accounts get free token grants).
2. Complete **real-name verification** (实名认证) if prompted.
3. Open the console → **API Keys** (direct: <https://open.bigmodel.cn/usercenter/apikeys>).
4. Click **创建 API Key**, name it anything (e.g. `relicvault`), then **copy it — it is shown only once**.
5. Paste it into `.env.local` as `ZHIPU_API_KEY=...`.
6. Apply it:
   - Docker: `docker compose restart app`
   - Local: restart `npm run dev`

**If you skip this:** the site still runs — browsing, login, exploring, manual submission all work — but clicking **"AI 分析"** on the upload form fails with `未配置 ZHIPU_API_KEY`.

**Cost:** `glm-4v-flash` is permanently free on Zhipu's platform.

---

## Demo data (seeded automatically)

On the **first read against an empty database**, the app inserts 12 sample artifacts owned by a demo `curator` account (see `src/lib/store/demo-data.ts`). The dataset ships in code with fixed titles, tags, images and creation dates, so **every fresh install sees identical demo content**.

The seeder is idempotent — it only runs when the demo account is missing, so deleting demo artifacts never triggers a re-insert. You can also trigger it manually:

```bash
# local (non-Docker) only
node scripts/seed-artifacts-mongo.js

# under Docker
docker compose exec app node scripts/seed-artifacts-mongo.js
```

---

## Project Structure

```
polymercaptial/
├── Dockerfile                  # 3-stage production image (deps → build → run)
├── docker-compose.yml          # app + MongoDB stack
├── .dockerignore               # keeps node_modules/.next/secrets out of the image
├── scripts/
│   └── seed-artifacts-mongo.js # optional manual demo-data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/             # login · register · callback (no site chrome)
│   │   ├── (main)/             # explore · artifacts · profile · dashboard (header + footer)
│   │   ├── gallery/            # alias of explore (same grid component)
│   │   ├── api/                # Route Handlers (see API below)
│   │   ├── layout.tsx          # root shell — renders the navbar
│   │   └── page.tsx            # home = submission form
│   ├── components/
│   │   ├── artifacts/          # upload form, cards, grid, detail, maps
│   │   ├── ai/                 # AI analysis panel
│   │   ├── auth/ · profile/ · layout/ · ui/
│   ├── hooks/                  # use-user · use-artifacts · use-artifact-submit
│   ├── lib/
│   │   ├── auth/               # bcrypt, JWT (jose), session, middleware, rate limit
│   │   ├── store/              # data-access layer + demo seeding
│   │   ├── models/… vision/    # (models live in src/models)
│   │   ├── vision/             # provider factory + Zhipu adapter
│   │   ├── i18n/               # 3-language dictionaries
│   │   ├── security/           # coordinate blurring
│   │   ├── mongodb.ts          # cached Mongoose connection
│   │   └── geocoding.ts        # Nominatim POI search + reverse geocoding
│   ├── models/                 # User.ts · Artifact.ts (Mongoose schemas)
│   ├── schemas/ · types/       # Zod schemas and TS types
│   └── middleware.ts           # protects routes, refreshes session
```

---

## API

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/register` · `/api/login` · `/api/logout` | Email + password auth (rate-limited: 5 req / 60 s) |
| GET | `/api/me` | Current session user (also clears stale cookies) |
| GET/POST | `/api/artifacts` | List (public, blurred coords) · create |
| GET/PATCH/DELETE | `/api/artifacts/[id]` | Read · update · delete (owner only) |
| POST | `/api/artifacts/[id]/like` · `/favorite` | Toggle like / favorite |
| GET/POST | `/api/artifacts/[id]/comments` | List / add comments |
| DELETE | `/api/artifacts/[id]/comments/[commentId]` | Delete own comment |
| GET | `/api/favorites` | Current user's favorites |
| GET/POST | `/api/profile` | Read / update profile |
| POST | `/api/analyze-artifact` | Send a photo to Zhipu GLM, get metadata suggestions |

---

## Data Model

Mongoose schemas in `src/models/`; applied at runtime, no migrations.

**`User`** — `username?`, `email` (unique), `password` (bcrypt hash, nullable), `displayName`, `bio`, `avatarUrl`, `role` (`user` | `admin`), `favorites[]`, `createdAt`.

**`Artifact`** — `title`, `description`, `imageUrl` (data URL), `aiTags[]`, `manualTags[]`, `era`, `dynasty`, `category`, `locationName`, `preservationStatus`, `exactLat` / `exactLng` (**server-only**), `blurredLat` / `blurredLng`, `isProtected`, `userId`, `likes[]`, `favorites[]`, `comments[]`, `createdAt`.

### GPS coordinate protection

A Mongoose `pre("save")` hook derives the public coordinates, and the DTO layer never serializes the exact ones:

| Site type | Public precision | Rough area |
|-----------|-----------------|-----------|
| Standard | 2 decimal places | ~1.1 km |
| Protected (`isProtected: true`) | 1 decimal place | ~11 km |

---

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server with hot reload (local runs only) |
| `npm run build` | Production build (also run inside Docker) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` |

---

## Troubleshooting

### Docker

| Symptom | Cause & fix |
|---------|-------------|
| `Cannot connect to the Docker daemon` | Docker Desktop isn't running — start it and wait for *Running*, then retry `docker ps` |
| `env file .env.local not found` | You skipped step 2 — `cp .env.example .env.local` first |
| `port is already allocated` | Something else owns 3000/27018. Find and stop it, or change the host side in `docker-compose.yml` (`"3001:3000"`) |
| `Conflict. The container name "/relicvault-mongo" is already in use` | A container from an earlier manual `docker run` exists: `docker rm -f relicvault-mongo && docker compose up -d` (the named volume keeps your data) |
| `relicvault-app` exits immediately | `docker compose logs app` — most often a missing `SESSION_SECRET` or `MONGODB_URI` |
| Mongo never becomes `(healthy)` | `docker compose logs mongo`; on Windows ensure the volume isn't on a network/OneDrive-synced path |
| Build is very slow / hangs on `npm ci` | First build is heavy (4–8 min). If it truly stalls, `docker compose build --no-cache` |
| I changed code but nothing happened | You need `docker compose up -d --build` (a plain `restart` reuses the old image) |

### Application

| Symptom | Cause & fix |
|---------|-------------|
| "AI 分析" fails with `未配置 ZHIPU_API_KEY` | Key missing/wrong in `.env.local` → fix it, then `docker compose restart app` |
| Login button bounces me to `/explore` | Stale session cookie from an older database. Hard-refresh (Ctrl+Shift+R) or delete the `rv_session` cookie — `/api/me` also self-heals this |
| Fresh database is empty | Visit <http://localhost:3000/explore> once; demo data seeds on first read |
| `429 Too Many Requests` on login | Rate limit (5 attempts / 60 s per IP). Wait a minute |

### Nuclear options

```bash
docker compose down -v      # full reset: delete containers AND database
docker compose up -d --build --force-recreate   # rebuild everything from scratch
docker system prune -a      # reclaim disk used by old images (removes build cache)
```

---

## Notes

- Routes are protected by `src/middleware.ts`: `/`, `/explore`, `/artifacts/new`, `/profile` require a session; unauthenticated visitors are redirected to `/login?redirectTo=…`. The "already logged in → skip login page" decision lives in the login/register pages (they verify against the database) so a valid JWT for a deleted user can never trap you in a redirect loop.
- Rate limiting is an in-memory sliding window keyed by `(path, ip)` — fine for one instance; swap in Redis for multi-instance deployments.
- Legacy Supabase / OpenAI / Gemini code paths remain in the tree for reference but are unreachable.

## License

Private — all rights reserved unless otherwise specified.
