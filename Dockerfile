# syntax=docker/dockerfile:1
#
# RelicVault AI — production container image (Next.js 14, served by `next start`)
#
# 3 stages: deps → builder → runner, so the final image carries no build
# toolchain and no unnecessary source files.

# ---------- 1. dependencies ----------
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2. build ----------
FROM node:22-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Every route is dynamic (the root layout reads cookies), so `next build` never
# touches MongoDB — no database is needed during the build stage.
RUN npm run build

# ---------- 3. runtime ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Runtime only needs the build output + node_modules + a few config files.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# Optional manual demo-data seeder, so `docker compose exec app node scripts/…` works
COPY --from=builder /app/scripts ./scripts

RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["npm", "start"]
