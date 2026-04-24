# Rental Management System

A Next.js application for managing rental properties, leases, and payments with document generation (rent receipts, rent due notices). Built with **Clean Architecture** principles.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) with TypeScript 6
- **Prisma 7** ORM with SQLite (driver adapter: better-sqlite3)
- **Vitest** for testing
- **TailwindCSS 4** for styling
- **next-intl** for French UI
- **Jose** for JWT authentication

## Architecture

Clean Architecture with strict layer separation. See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed documentation.

**For Claude Code**: See [CLAUDE.md](CLAUDE.md) for development guidelines, conventions, and common pitfalls.

## Features

1. **Authentication**: Simple login with credentials stored in `.env`
2. **CRUD Operations**: Manage landlords, properties, tenants, and leases
3. **Payment Management**: Record and track rent payments
4. **Document Generation**:
   - Rent receipts (quittance de loyer)
   - Partial payment receipts
   - Rent due notices (avis d'échéance)
5. **CSV Export**: Export payment history
6. **Payment Status**: Check if tenants are up-to-date or late with rent

---

## Lancer avec Docker (recommandé)

La façon la plus simple de démarrer, sans installer Node.js localement.

### Prérequis
- [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) ≥ 24

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

### Développement (hot reload)

```bash
docker compose --profile dev up
# → http://localhost:3000
```

### Production

```bash
docker compose --profile prod up -d --build
# → http://localhost:3000
```

### Arrêter

```bash
docker compose --profile dev down
# ou
docker compose --profile prod down
```

> Voir [docs/DOCKER.md](docs/DOCKER.md) pour le guide complet (installation Docker, gestion des volumes, résolution de problèmes).

---

## Lancer en local (sans Docker)

### Prérequis
- Node.js 24+
- npm

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos identifiants

# 3. Initialiser la base de données
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) et se connecter avec les identifiants du `.env`.

### Commandes courantes

```bash
npm run dev              # Serveur de développement
npm run build            # Build de production
npm start                # Lancer le build de production
npm test                 # Lancer les tests
npm run prisma:studio    # Interface graphique de la base de données
```

### Tests

```bash
npm test                 # Tous les tests
npm test -- --watch      # Mode watch
npm run test:ui          # Mode UI
```

---

## Documentation

- [docs/DOCKER.md](docs/DOCKER.md) — Utilisation avec Docker
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architecture Clean Architecture
- [CLAUDE.md](CLAUDE.md) — Guide de développement pour Claude Code

## License

MIT
