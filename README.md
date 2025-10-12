# Rental Management System

A clean architecture Next.js application for managing rental properties, leases, and generating rental documents.

## Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/              # Domain layer (pure TypeScript, no dependencies)
│   ├── entities/        # Business entities (Landlord, Property, Tenant, Lease, Payment)
│   └── value-objects/   # Value objects (Money, Email)
├── use-cases/           # Application layer (business rules)
│   ├── interfaces/      # Repository interfaces
│   └── *.ts             # Use case implementations
├── infrastructure/      # Infrastructure layer
│   ├── database/        # Prisma client
│   ├── repositories/    # Prisma repository implementations
│   └── auth/            # Authentication logic
└── app/                 # Presentation layer (Next.js App Router)
    ├── api/             # API routes
    └── */               # Pages and components
```

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Prisma ORM** with SQLite
- **Vitest** for testing (TDD on domain/use-case layers)
- **TailwindCSS** for styling
- **Jose** for JWT authentication

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

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your credentials:
   ```
   DATABASE_URL="file:./dev.db"
   AUTH_EMAIL="admin@example.com"
   AUTH_PASSWORD="your-secure-password"
   JWT_SECRET="your-jwt-secret-key"
   ```

4. Generate Prisma client and run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Testing

Run tests with Vitest:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in watch mode
npm test -- --watch
```

Tests cover:
- Domain entities (Landlord, Property, Tenant, Lease, Payment)
- Value objects (Money, Email)
- Use cases (CreateLandlord, CreateLease, RecordPayment, CheckPaymentStatus)

## Database Schema

The Prisma schema includes:

- **User**: Single user for authentication
- **Landlord**: Natural persons or legal entities (SCI)
- **Property**: Rental properties (apartments, houses, garages, etc.)
- **Tenant**: Tenants renting properties
- **Lease**: Links properties with tenants, includes rent and charges
- **Payment**: Records of rent payments
- **RentRevision**: Tracks changes to rent over time (for future use)

## API Routes

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current session

### Landlords
- `GET /api/landlords` - List landlords
- `POST /api/landlords` - Create landlord

### Leases
- `GET /api/leases?propertyId=xxx` - List leases by property
- `GET /api/leases?tenantId=xxx` - List leases by tenant
- `POST /api/leases` - Create lease

### Payments
- `GET /api/payments?leaseId=xxx` - List payments for a lease
- `POST /api/payments` - Record payment

### Documents
- `GET /api/documents/rent-receipt/[paymentId]` - Generate rent receipt
- `GET /api/payments/export/[leaseId]` - Export payments as CSV

## Project Structure

### Domain Layer
Pure TypeScript with no external dependencies. Contains:
- **Entities**: Business objects with identity and lifecycle
- **Value Objects**: Immutable objects defined by their attributes

### Use Cases Layer
Contains business logic and orchestrates domain entities. Depends only on domain layer and defines repository interfaces.

### Infrastructure Layer
Implements repository interfaces using Prisma and handles authentication.

### Presentation Layer
Next.js App Router pages, components, and API routes.

## Development Guidelines

1. **TDD for Domain/Use Cases**: Write tests first for domain entities and use cases
2. **Dependency Rule**: Dependencies point inward (presentation → use cases → domain)
3. **Repository Pattern**: Use cases depend on interfaces, infrastructure provides implementations
4. **Pure Domain Logic**: Domain layer has no framework dependencies

## Roadmap

Future features to implement:
- [ ] Rent revision based on IRL index
- [ ] Email notifications for rent due dates
- [ ] PDF generation for documents
- [ ] Multi-user support
- [ ] Dashboard analytics
- [ ] Document templates customization

## License

MIT
