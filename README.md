# Rental Management System

A Next.js application for managing rental properties, leases, and payments with document generation (rent receipts, rent due notices). Built with **Clean Architecture** principles.

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **Prisma ORM** with SQLite (PostgreSQL ready)
- **Vitest** for testing
- **TailwindCSS** for styling
- **next-intl** for French UI
- **Jose** for JWT authentication

## Architecture

Clean Architecture with strict layer separation. See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

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

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 3. Set up database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with your `.env` credentials.

## Development

### Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run tests
npm run prisma:studio    # Open database GUI
```

See [SETUP.md](SETUP.md) for detailed development instructions.

### Testing

Tests focus on domain and use-case layers (TDD approach):

```bash
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm run test:ui          # UI mode
```

## Project Documentation

- **[README.md](README.md)** - This file (project overview, quick start)
- **[CLAUDE.md](CLAUDE.md)** - Development guidelines for Claude Code
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture documentation
- **[SETUP.md](SETUP.md)** - Complete setup and troubleshooting guide

## Roadmap

- [ ] Rent revision based on IRL (French rent index)
- [ ] Email notifications for rent due dates
- [ ] PDF generation for documents
- [ ] Multi-user support with roles
- [ ] Dashboard analytics

## License

MIT
