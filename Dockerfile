# syntax=docker/dockerfile:1

# ─── Base: Node + outils de compilation pour les modules natifs ─────────────
FROM node:24-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# ─── Toutes les dépendances (dev + prod) — pour build et tests ──────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ─── Dépendances de production uniquement ───────────────────────────────────
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Développement ──────────────────────────────────────────────────────────
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]

# ─── Build de production ─────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ─── Production ─────────────────────────────────────────────────────────────
FROM node:24-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app/data
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts .
COPY --from=builder /app/messages ./messages
COPY --from=builder /app/next.config.ts .
COPY package.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
