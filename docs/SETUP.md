# Setup Guide

## Complete Project Structure

```
2510-dokimo2/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data seeding
├── src/
│   ├── domain/                # Domain layer (pure business logic)
│   │   ├── entities/          # Business entities
│   │   │   ├── __tests__/     # Entity tests
│   │   │   ├── Landlord.ts
│   │   │   ├── Property.ts
│   │   │   ├── Tenant.ts
│   │   │   ├── Lease.ts
│   │   │   └── Payment.ts
│   │   └── value-objects/     # Value objects
│   │       ├── __tests__/     # Value object tests
│   │       ├── Money.ts
│   │       └── Email.ts
│   ├── use-cases/             # Application layer
│   │   ├── __tests__/         # Use case tests
│   │   ├── interfaces/        # Repository interfaces
│   │   │   ├── ILandlordRepository.ts
│   │   │   ├── IPropertyRepository.ts
│   │   │   ├── ITenantRepository.ts
│   │   │   ├── ILeaseRepository.ts
│   │   │   └── IPaymentRepository.ts
│   │   ├── CreateLandlord.ts
│   │   ├── CreateLease.ts
│   │   ├── RecordPayment.ts
│   │   ├── CheckPaymentStatus.ts
│   │   ├── GenerateRentReceipt.ts
│   │   ├── GenerateRentDueNotice.ts
│   │   └── ExportPaymentsToCSV.ts
│   ├── infrastructure/        # Infrastructure layer
│   │   ├── auth/              # Authentication
│   │   │   ├── credentials.ts
│   │   │   └── session.ts
│   │   ├── database/          # Database client
│   │   │   └── prisma.ts
│   │   └── repositories/      # Repository implementations
│   │       ├── PrismaLandlordRepository.ts
│   │       ├── PrismaPropertyRepository.ts
│   │       ├── PrismaTenantRepository.ts
│   │       ├── PrismaLeaseRepository.ts
│   │       └── PrismaPaymentRepository.ts
│   ├── app/                   # Presentation layer (Next.js)
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── landlords/route.ts
│   │   │   ├── leases/route.ts
│   │   │   ├── payments/
│   │   │   │   ├── route.ts
│   │   │   │   └── export/[leaseId]/route.ts
│   │   │   └── documents/
│   │   │       └── rent-receipt/[paymentId]/route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── middleware.ts          # Route protection
├── .env.example               # Environment variables template
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL="file:./dev.db"
AUTH_EMAIL="admin@example.com"
AUTH_PASSWORD="SecurePassword123!"
JWT_SECRET="your-very-secure-jwt-secret-min-32-chars"
NODE_ENV="development"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# With UI
npm run test:ui
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Login

Use the credentials from your `.env` file:
- Email: `admin@example.com` (or your AUTH_EMAIL)
- Password: Your AUTH_PASSWORD

## Sample Data

The seed script creates:
- 1 user
- 2 landlords (1 natural person, 1 legal entity)
- 2 properties
- 2 tenants
- 2 leases
- 2 payments

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run tests
npm run test:ui          # Run tests with UI

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database

# Linting
npm run lint             # Run ESLint
```

## Testing Architecture

Tests are located in `__tests__` folders next to the code they test:

- **Domain tests**: `src/domain/entities/__tests__/`, `src/domain/value-objects/__tests__/`
- **Use case tests**: `src/use-cases/__tests__/`

Run specific tests:

```bash
# Run specific test file
npm test -- Money.test.ts

# Run tests matching pattern
npm test -- --grep "Money"
```

## API Usage Examples

### Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Check session
curl http://localhost:3000/api/auth/me

# Logout
curl -X POST http://localhost:3000/api/auth/logout
```

### Landlords

```bash
# List landlords
curl http://localhost:3000/api/landlords

# Create landlord
curl -X POST http://localhost:3000/api/landlords \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "type": "NATURAL_PERSON",
    "address": "123 Main St, Paris",
    "email": "john@example.com",
    "phone": "+33123456789"
  }'
```

### Leases

```bash
# List active leases
curl http://localhost:3000/api/leases

# Create lease
curl -X POST http://localhost:3000/api/leases \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "property-1",
    "tenantId": "tenant-1",
    "startDate": "2024-01-01",
    "rentAmount": 1000,
    "chargesAmount": 100,
    "paymentDueDay": 5
  }'
```

### Payments

```bash
# Record payment
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "leaseId": "lease-1",
    "amount": 1100,
    "paymentDate": "2024-03-05",
    "periodStart": "2024-03-01",
    "periodEnd": "2024-03-31",
    "type": "FULL"
  }'

# Export payments to CSV
curl http://localhost:3000/api/payments/export/lease-1 > payments.csv
```

### Documents

```bash
# Generate rent receipt
curl http://localhost:3000/api/documents/rent-receipt/payment-1
```

## Troubleshooting

### Database Issues

```bash
# Reset database
rm prisma/dev.db
npm run prisma:migrate
npm run prisma:seed
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npm run prisma:generate
```

### Port Already in Use

```bash
# Use different port
PORT=3001 npm run dev
```

## Next Steps

1. Customize authentication (add more users, roles)
2. Implement missing CRUD pages for tenants and properties
3. Add PDF generation for documents
4. Implement rent revision features
5. Add email notifications
6. Deploy to production

## Production Deployment

Before deploying:

1. Set strong `JWT_SECRET` and `AUTH_PASSWORD`
2. Use PostgreSQL instead of SQLite
3. Enable HTTPS
4. Set `NODE_ENV=production`
5. Configure proper CORS settings
6. Add rate limiting
7. Implement proper logging

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vitest Documentation](https://vitest.dev/)
