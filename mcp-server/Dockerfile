# syntax=docker/dockerfile:1
# TypeScript est compilé localement avant le déploiement (npm run build).
# Le Dockerfile ne fait que copier dist/ et installer les dépendances de prod.

# ─── Dépendances de production (compile better-sqlite3 natif) ─────────────────
FROM node:24-slim AS prod-deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev

# ─── Image finale ─────────────────────────────────────────────────────────────
FROM node:24-slim AS production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
