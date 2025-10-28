# Architecture Documentation

## Clean Architecture Overview

This project implements **Clean Architecture** (also known as Hexagonal Architecture or Ports and Adapters), ensuring:

- **Independence**: Business logic is independent of frameworks, UI, databases
- **Testability**: Domain and use cases can be tested without external dependencies
- **Flexibility**: Easy to swap implementations (e.g., change database, UI framework)
- **Maintainability**: Clear separation of concerns

## Layer Dependencies

```
Presentation Layer (Next.js)
         ↓
  Use Cases Layer
         ↓
    Domain Layer
```

**Dependency Rule**: Dependencies point inward. Inner layers know nothing about outer layers.

## Layers Description

### 1. Domain Layer (`src/domain/`)

**Pure TypeScript** - No framework dependencies.

#### Entities
Business objects with identity and behavior:

- **Landlord**: Represents property owners (natural persons or legal entities)
- **Property**: Rental properties (apartments, houses, garages)
- **Tenant**: People renting properties
- **Lease**: Contract linking property and tenant with rent terms
- **Payment**: Records of rent payments

Each entity:
- Encapsulates business rules
- Validates its own state
- Has getter methods (immutable)
- Created via static factory method

Example:
```typescript
const lease = Lease.create({
  id: 'lease-1',
  propertyId: 'prop-1',
  tenantId: 'tenant-1',
  startDate: new Date('2024-01-01'),
  rentAmount: Money.create(1000),
  chargesAmount: Money.create(100),
  paymentDueDay: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Business logic in domain
const totalAmount = lease.totalAmount; // 1100
const isActive = lease.isActive(new Date());
const expectedDate = lease.getExpectedPaymentDate(new Date());
```

#### Value Objects
Immutable objects defined by attributes:

- **Money**: Represents monetary amounts with validation and operations
- **Email**: Represents validated email addresses

Value objects:
- Have no identity
- Are immutable
- Validate themselves
- Provide domain operations

Example:
```typescript
const amount = Money.create(100);
const total = amount.add(Money.create(50)); // 150
amount.isGreaterThan(Money.create(50)); // true
```

### 2. Use Cases Layer (`src/use-cases/`)

Orchestrates domain entities to fulfill business requirements.

#### Repository Interfaces
Define contracts for data access (ports):

```typescript
export interface ILeaseRepository {
  findById(id: string): Promise<Lease | null>;
  findByPropertyId(propertyId: string): Promise<Lease[]>;
  create(lease: Lease): Promise<Lease>;
  update(lease: Lease): Promise<Lease>;
  delete(id: string): Promise<void>;
}
```

#### Use Cases
Implement specific business operations:

- **CreateLandlord**: Creates a new landlord with validation
- **CreateLease**: Creates a new lease contract
- **RecordPayment**: Records a rent payment
- **CheckPaymentStatus**: Determines if tenant is up-to-date or late
- **GenerateRentReceipt**: Generates rent receipt data
- **GenerateRentDueNotice**: Generates rent due notice data
- **ExportPaymentsToCSV**: Exports payment history

Example:
```typescript
export class RecordPayment {
  constructor(private paymentRepository: IPaymentRepository) {}

  async execute(input: RecordPaymentInput): Promise<Payment> {
    // Create domain entity (validates itself)
    const payment = Payment.create({
      id: randomUUID(),
      leaseId: input.leaseId,
      amount: Money.create(input.amount),
      paymentDate: input.paymentDate,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      type: input.type,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Persist via repository
    return this.paymentRepository.create(payment);
  }
}
```

### 3. Infrastructure Layer (`src/infrastructure/`)

Implements technical details and adapters.

#### Database
- **Prisma Client**: Database ORM configuration
- **SQLite**: Development database (easily replaced with PostgreSQL)

#### Repositories (Adapters)
Implement repository interfaces using Prisma:

```typescript
export class PrismaLeaseRepository implements ILeaseRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Lease | null> {
    const lease = await this.prisma.lease.findUnique({ where: { id } });
    if (!lease) return null;
    return this.toDomain(lease); // Convert to domain entity
  }

  private toDomain(raw: any): Lease {
    return Lease.create({
      id: raw.id,
      propertyId: raw.propertyId,
      tenantId: raw.tenantId,
      startDate: raw.startDate,
      endDate: raw.endDate,
      rentAmount: Money.create(raw.rentAmount),
      chargesAmount: Money.create(raw.chargesAmount),
      paymentDueDay: raw.paymentDueDay,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
```

#### Authentication
- **Credentials**: Simple email/password from `.env`
- **Session**: JWT-based authentication using jose
- **Middleware**: Route protection

### 4. Presentation Layer (`src/app/`)

Next.js App Router implementation.

#### API Routes
REST endpoints that:
1. Validate authentication
2. Parse request
3. Instantiate use cases with repositories
4. Execute use case
5. Return response

Example:
```typescript
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const repository = new PrismaPaymentRepository(prisma);
  const useCase = new RecordPayment(repository);

  const payment = await useCase.execute({
    leaseId: body.leaseId,
    amount: Number(body.amount),
    paymentDate: new Date(body.paymentDate),
    periodStart: new Date(body.periodStart),
    periodEnd: new Date(body.periodEnd),
    type: body.type,
    notes: body.notes,
  });

  return NextResponse.json({ /* serialized payment */ });
}
```

#### Pages
React Server Components for UI:
- `/login` - Authentication page
- `/dashboard` - Main dashboard
- Other CRUD pages (to be implemented)

## Testing Strategy

### Domain Layer Tests
Test entities and value objects in isolation:

```typescript
describe('Money', () => {
  it('should create a Money instance with valid amount', () => {
    const money = Money.create(100);
    expect(money.getValue()).toBe(100);
  });

  it('should throw error for negative amount', () => {
    expect(() => Money.create(-10)).toThrow();
  });

  it('should add two Money instances', () => {
    const result = Money.create(100).add(Money.create(50));
    expect(result.getValue()).toBe(150);
  });
});
```

### Use Case Tests
Test business logic with mocked repositories:

```typescript
describe('RecordPayment', () => {
  let mockRepository: IPaymentRepository;
  let useCase: RecordPayment;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      // ... other methods
    };
    useCase = new RecordPayment(mockRepository);
  });

  it('should record a payment successfully', async () => {
    const input = { /* payment input */ };
    vi.mocked(mockRepository.create).mockResolvedValue(/* expected payment */);

    const result = await useCase.execute(input);

    expect(result.leaseId).toBe(input.leaseId);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });
});
```

**No tests for**:
- Infrastructure layer (integration with real database)
- Presentation layer (UI/API routes)

These can be tested with E2E tests if needed.

## Design Patterns Used

### 1. Repository Pattern
Abstracts data access behind interfaces. Use cases depend on interfaces, not implementations.

### 2. Factory Pattern
Entities created via static factory methods:
```typescript
const money = Money.create(100);
const lease = Lease.create({ /* props */ });
```

### 3. Value Object Pattern
Immutable objects representing domain concepts without identity.

### 4. Dependency Injection
Use cases receive dependencies through constructor:
```typescript
const useCase = new RecordPayment(paymentRepository);
```

### 5. Single Responsibility Principle
Each use case does one thing. Each entity manages its own validation.

## Data Flow Example

### Recording a Payment

1. **User** makes POST request to `/api/payments`
2. **API Route** validates authentication and parses JSON
3. **API Route** creates `PrismaPaymentRepository` instance
4. **API Route** creates `RecordPayment` use case with repository
5. **Use Case** creates `Payment` entity (validates itself)
6. **Use Case** calls `repository.create(payment)`
7. **Repository** converts domain entity to Prisma format
8. **Repository** persists to database via Prisma
9. **Repository** converts database result back to domain entity
10. **Use Case** returns domain entity
11. **API Route** serializes entity and returns JSON

```
User Request
    ↓
API Route (Presentation)
    ↓
RecordPayment Use Case
    ↓
Payment Entity (Domain)
    ↓
IPaymentRepository Interface
    ↓
PrismaPaymentRepository (Infrastructure)
    ↓
Database (SQLite/PostgreSQL)
```

## Key Benefits

### 1. Testability
Domain and use cases tested without database, HTTP, or framework dependencies.

### 2. Flexibility
Can replace:
- Database (SQLite → PostgreSQL)
- UI framework (Next.js → anything)
- Authentication method
- Document generation strategy

Without changing domain or use case code.

### 3. Maintainability
Business rules centralized in domain layer. Technical details isolated in infrastructure.

### 4. Scalability
Easy to add:
- New use cases
- New entities
- New repository implementations
- New API endpoints

### 5. Team Collaboration
Different teams can work on different layers independently:
- Backend team: domain + use cases
- Infrastructure team: repositories, database
- Frontend team: presentation layer

## Future Improvements

### Domain Events
Add events for important business actions:
```typescript
class PaymentRecorded extends DomainEvent {
  constructor(public readonly payment: Payment) {}
}
```

### CQRS (Command Query Responsibility Segregation)
Separate read and write models for complex queries.

### Aggregates
Group related entities (e.g., Lease as aggregate root containing Payments).

### Domain Services
For operations spanning multiple entities.

### Specification Pattern
For complex business rules and queries.

## Conclusion

This architecture ensures the business logic remains:
- **Independent** of technical details
- **Testable** without external dependencies
- **Flexible** for future changes
- **Maintainable** with clear separation of concerns

The investment in clean architecture pays off in:
- Lower maintenance costs
- Easier testing
- Better code organization
- Reduced technical debt
- Improved team productivity
