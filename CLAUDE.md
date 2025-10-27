# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**For general project information, installation, and features, see [README.md](README.md).**

## CRITICAL RULES

### Language Convention
**🔴 MANDATORY: All code MUST be written in English, but the UI MUST be displayed in French.**

- **Code** (variables, functions, classes, comments): ENGLISH ONLY
- **User Interface** (labels, messages, buttons): FRENCH ONLY (via `next-intl`)
- **Translation files**: Located in `messages/fr.json`
- **Usage in components**:
  - Server components: `const t = await getTranslations('namespace');`
  - Client components: `const t = useTranslations('namespace');`

Example:
```typescript
// ✅ CORRECT: English code, French UI via translation
const calculateTotalRent = (lease: Lease) => {
  return lease.totalAmount; // Code in English
};

// In component:
<button>{t('payments.addButton')}</button> // "Ajouter un paiement" (French UI)

// ❌ WRONG: French in code
const calculerLoyerTotal = (bail: Bail) => { ... }
```

### Testing Requirements
**Tests are MANDATORY for domain and use-case layers only:**
- ✅ Test: Domain entities (`src/domain/entities/`)
- ✅ Test: Value objects (`src/domain/value-objects/`)
- ✅ Test: Use cases (`src/use-cases/`)
- ❌ Don't test: Infrastructure (Prisma repositories)
- ❌ Don't test: Presentation (API routes, pages)

**Always follow TDD**: Write tests BEFORE implementation for domain/use-case code.

## Architecture

This project follows **Clean Architecture** with strict layer separation. See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

### Current Structure (Transitioning)
The codebase is currently organized by layer, but **should evolve to feature-based organization**:

**Current (layer-based)**:
```
src/
├── domain/              # All domain entities together
├── use-cases/           # All use cases together
├── infrastructure/      # All infrastructure together
└── app/                # Next.js presentation
```

**Target (feature-based)**: Each feature contains its own Clean Architecture layers:
```
src/
├── features/
│   ├── landlord/
│   │   ├── domain/          # Landlord entity, value objects
│   │   ├── application/     # Use cases (CreateLandlord, UpdateLandlord)
│   │   ├── infrastructure/  # PrismaLandlordRepository
│   │   └── presentation/    # API routes, pages, components
│   ├── lease/
│   │   ├── domain/          # Lease entity, Payment entity
│   │   ├── application/     # CreateLease, RecordPayment, CheckPaymentStatus
│   │   ├── infrastructure/  # PrismaLeaseRepository, PrismaPaymentRepository
│   │   └── presentation/    # Lease API routes, lease pages
│   └── shared/
│       ├── domain/          # Money, Email value objects
│       └── infrastructure/  # Prisma client, auth
└── app/                     # Next.js App Router structure
```

**When adding new features**: Use the feature-based structure with `domain/`, `application/`, `infrastructure/`, and `presentation/` folders inside each feature folder.

### Dependency Rule (CRITICAL)
**Dependencies always point inward**: `presentation → application → domain`

- **Domain layer**: ZERO external dependencies (pure TypeScript)
- **Application layer** (use cases): Depends only on domain + repository interfaces
- **Infrastructure layer**: Implements repository interfaces, uses Prisma/external libs
- **Presentation layer**: Depends on application use cases + infrastructure

### Key Architectural Patterns

**1. Repository Pattern**: Use cases depend on interfaces (`ILeaseRepository`), infrastructure provides implementations (`PrismaLeaseRepository`). This allows swapping databases without changing business logic.

**2. Factory Pattern**: Entities are created via static factory methods:
```typescript
const money = Money.create(1000);
const lease = Lease.create({ /* props */ });
```

**3. Value Objects**: Immutable objects for domain concepts:
```typescript
const rent = Money.create(1000);
const total = rent.add(Money.create(100)); // Returns new Money(1100)
```

**4. Domain Validation**: Entities validate themselves on creation:
```typescript
Money.create(-100); // Throws error: "Money amount cannot be negative"
```

## Working with the Codebase

### Adding a New Feature (Feature-Based Structure)

**Always follow TDD for domain/application layers. Use feature folders for new code.**

1. **Create feature folder structure**:
   ```
   src/features/my-feature/
   ├── domain/
   │   ├── __tests__/
   │   └── MyEntity.ts
   ├── application/
   │   ├── __tests__/
   │   ├── interfaces/
   │   │   └── IMyRepository.ts
   │   └── CreateMyEntity.ts
   ├── infrastructure/
   │   └── PrismaMyRepository.ts
   └── presentation/
       ├── api/
       └── components/
   ```

2. **Start with domain (TDD)**:
   - Write tests in `domain/__tests__/`
   - Create entity with validation and business logic
   - Entities MUST be immutable and self-validating
   - Use English for all code

3. **Define repository interface**:
   - Create in `application/interfaces/IMyRepository.ts`
   - Define contract (methods needed by use cases)

4. **Create use case (TDD)**:
   - Write tests in `application/__tests__/` with mocked repository
   - Implement use case depending ONLY on repository interface
   - Use English for all code, French only in UI translations

5. **Implement infrastructure**:
   - Create Prisma repository in `infrastructure/`
   - Implement interface methods
   - Convert between Prisma models (Float, Date) and domain entities (Money, etc.)

6. **Add presentation layer**:
   - Create API routes (with `getSession()` authentication)
   - Create page components using `getTranslations()` or `useTranslations()`
   - All UI text MUST come from `messages/fr.json`

### Important Domain Entities

**Lease**: Central entity linking Property and Tenant
- Contains rent and charges amounts (as Money value objects)
- Has `paymentDueDay` (1-31) for payment scheduling
- Methods: `totalAmount`, `isActive()`, `getExpectedPaymentDate()`

**Payment**: Records rent payments
- Links to Lease
- Has `paymentDate`, `periodStart`, `periodEnd`
- Type can be "FULL" or "PARTIAL"

**Money**: Value object for all monetary amounts
- Validates non-negative amounts
- Operations: `add()`, `subtract()`, `multiply()`, `isGreaterThan()`, etc.
- Always use Money, never raw numbers in domain logic

### Testing Strategy

**MANDATORY: Test domain and application layers ONLY**
- ✅ Domain entities: Validation, business rules, calculations
- ✅ Application (use cases): Mock repositories, test workflows
- ❌ Infrastructure: Don't test Prisma repositories
- ❌ Presentation: Don't test API routes/pages

**TDD Workflow**:
```bash
# 1. Write failing test
npm test -- --watch MyEntity.test.ts

# 2. Implement minimum code to pass

# 3. Refactor

# 4. Repeat
```

Run tests:
```bash
npm test                       # All tests
npm test -- --watch            # Watch mode
npm test -- Money.test.ts      # Specific file
npm test -- --grep "Money"     # Pattern matching
```

### Authentication

Simple JWT-based authentication:
- Single user credentials in `.env`: `AUTH_EMAIL`, `AUTH_PASSWORD`
- Password hashed with bcrypt (see `src/infrastructure/auth/credentials.ts`)
- Sessions use JWT tokens with 24h expiration
- Session cookie: `httpOnly`, `sameSite: lax`

**Protecting routes**: All API routes should start with:
```typescript
const session = await getSession();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Internationalization (i18n)

**UI is in French using next-intl**:
- Translations: `messages/fr.json`
- Server components: `const t = await getTranslations('namespace');`
- Client components: `const t = useTranslations('namespace');`
- Add new keys to `messages/fr.json` when adding UI text

### Database

**After schema changes**:
```bash
npm run prisma:generate && npm run prisma:migrate
```

Schema notes:
- All IDs use `cuid()`
- All models have `createdAt`/`updatedAt`
- See `prisma/schema.prisma` for full schema

### Important Technical Notes

- Path alias: `@/` → `src/`
- Prisma client: Regenerated to `node_modules/.prisma/client/` on `prisma:generate`
- Environment: See `.env.example` for required variables

### Common Pitfalls (AVOID THESE)

1. **🚫 French in code**: Code must be in English, only UI in French
   - ❌ `const calculerLoyer = () => {}`
   - ✅ `const calculateRent = () => {}`

2. **🚫 Framework dependencies in domain**: Domain = pure TypeScript only
   - ❌ `import { prisma } from '@/infrastructure/database'` in domain
   - ✅ No imports except other domain files

3. **🚫 Raw numbers for money**: Always use Money value object
   - ❌ `const total = rent + charges;`
   - ✅ `const total = rent.add(charges);`

4. **🚫 Validation outside domain**: Entities validate themselves
   - ❌ Validation in use case or API route
   - ✅ Validation in entity constructor

5. **🚫 Mutable entities**: Domain entities are immutable
   - ❌ `lease.rentAmount = newAmount;`
   - ✅ `const updatedLease = Lease.create({ ...lease, rentAmount });`

6. **🚫 Missing tests for domain/application**: Tests are mandatory
   - ❌ Creating entity without tests
   - ✅ TDD: test first, then implement

7. **🚫 Hardcoded French text in components**: Use translations
   - ❌ `<button>Ajouter</button>`
   - ✅ `<button>{t('common.add')}</button>`

## Project-Specific Conventions

**Code Style**:
- Language: English for code, French for UI
- Entity factory: `Entity.create({ ... })`
- Repository methods: `findById`, `findByPropertyId`, `create`, `update`, `delete`
- Use case naming: Imperative verbs (CreateLease, RecordPayment, CheckPaymentStatus)
- Test location: `__tests__/` folder next to implementation

**Domain Rules**:
- Monetary amounts: Always use `Money.create()`, never raw numbers
- Immutability: All domain entities are immutable
- Validation: In entity constructors, not in use cases

**API Conventions**:
- Authentication: Check `getSession()` on all protected routes
- Response format: Serialize domain entities (Money → number, Date → ISO string)
- Error handling: Return appropriate HTTP status codes

## Quick Reference

**Create a new feature**:
```bash
# 1. Create feature structure
mkdir -p src/features/my-feature/{domain,application,infrastructure,presentation}

# 2. TDD: Write domain tests first
# 3. Implement domain entity (English code)
# 4. Write use case tests with mocked repo
# 5. Implement use case
# 6. Implement Prisma repository
# 7. Create API routes + UI (French via translations)
```

**Add French translation**:
```json
// messages/fr.json
{
  "myFeature": {
    "title": "Mon titre en français",
    "button": "Ajouter"
  }
}
```

**Run tests before commit**:
```bash
npm test && npm run lint
```

## Example: Feature-Based Structure

Here's a concrete example of how a feature should be organized:

```
src/features/lease/
├── domain/
│   ├── __tests__/
│   │   ├── Lease.test.ts
│   │   └── Payment.test.ts
│   ├── Lease.ts              # Lease entity with business logic
│   └── Payment.ts            # Payment entity
├── application/
│   ├── __tests__/
│   │   ├── CreateLease.test.ts
│   │   ├── RecordPayment.test.ts
│   │   └── CheckPaymentStatus.test.ts
│   ├── interfaces/
│   │   ├── ILeaseRepository.ts
│   │   └── IPaymentRepository.ts
│   ├── CreateLease.ts        # Use case: create new lease
│   ├── RecordPayment.ts      # Use case: record rent payment
│   └── CheckPaymentStatus.ts # Use case: check if tenant is late
├── infrastructure/
│   ├── PrismaLeaseRepository.ts
│   └── PrismaPaymentRepository.ts
└── presentation/
    ├── api/
    │   ├── leases/
    │   │   └── route.ts      # POST /api/leases
    │   └── payments/
    │       └── route.ts      # POST /api/payments
    └── components/
        ├── LeaseCard.tsx
        └── PaymentForm.tsx
```

**Key points**:
- Each feature is self-contained
- Clear separation between layers
- Tests live next to implementation
- Shared code (Money, Email) goes in `src/features/shared/`
