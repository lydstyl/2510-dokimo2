import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLease } from '../CreateLease';
import { ILeaseRepository } from '../interfaces/ILeaseRepository';
import { Lease } from '../../domain/entities/Lease';
import { Money } from '../../domain/value-objects/Money';

describe('CreateLease', () => {
  let mockRepository: ILeaseRepository;
  let useCase: CreateLease;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByPropertyId: vi.fn(),
      findByTenantId: vi.fn(),
      findActiveLeases: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CreateLease(mockRepository);
  });

  it('should create a lease successfully', async () => {
    const input = {
      propertyId: 'prop-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: 1000,
      chargesAmount: 100,
      paymentDueDay: 5,
    };

    const expectedLease = Lease.create({
      id: 'lease-1',
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      startDate: input.startDate,
      rentAmount: Money.create(input.rentAmount),
      chargesAmount: Money.create(input.chargesAmount),
      paymentDueDay: input.paymentDueDay,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(expectedLease);

    const result = await useCase.execute(input);

    expect(result.propertyId).toBe(input.propertyId);
    expect(result.tenantId).toBe(input.tenantId);
    expect(result.rentAmount.getValue()).toBe(1000);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should throw error for invalid payment due day', async () => {
    const input = {
      propertyId: 'prop-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: 1000,
      chargesAmount: 100,
      paymentDueDay: 35,
    };

    await expect(useCase.execute(input)).rejects.toThrow('Payment due day must be between 1 and 31');
  });

  it('should throw error for negative rent amount', async () => {
    const input = {
      propertyId: 'prop-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: -100,
      chargesAmount: 100,
      paymentDueDay: 5,
    };

    await expect(useCase.execute(input)).rejects.toThrow();
  });
});
