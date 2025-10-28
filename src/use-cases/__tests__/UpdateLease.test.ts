import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLease } from '../UpdateLease';
import { ILeaseRepository } from '../interfaces/ILeaseRepository';
import { Lease } from '../../domain/entities/Lease';
import { Money } from '../../domain/value-objects/Money';

describe('UpdateLease', () => {
  let mockRepository: ILeaseRepository;
  let updateLease: UpdateLease;

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
    updateLease = new UpdateLease(mockRepository);
  });

  it('should update a lease with valid data', async () => {
    const existingLease = Lease.create({
      id: 'lease-123',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: Money.create(1000),
      chargesAmount: Money.create(100),
      paymentDueDay: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });

    const input = {
      id: 'lease-123',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      rentAmount: 1200,
      chargesAmount: 150,
      paymentDueDay: 10,
    };

    const updatedLease = Lease.create({
      id: input.id,
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      startDate: input.startDate,
      endDate: input.endDate,
      rentAmount: Money.create(input.rentAmount),
      chargesAmount: Money.create(input.chargesAmount),
      paymentDueDay: input.paymentDueDay,
      createdAt: existingLease.createdAt,
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingLease);
    vi.mocked(mockRepository.update).mockResolvedValue(updatedLease);

    const result = await updateLease.execute(input);

    expect(result).toBe(updatedLease);
    expect(mockRepository.findById).toHaveBeenCalledWith('lease-123');
    expect(mockRepository.update).toHaveBeenCalledOnce();
  });

  it('should throw error when lease not found', async () => {
    const input = {
      id: 'non-existent-id',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: 1000,
      chargesAmount: 100,
      paymentDueDay: 5,
    };

    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(updateLease.execute(input)).rejects.toThrow('Lease not found');
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should throw error when rentAmount is negative', async () => {
    const existingLease = Lease.create({
      id: 'lease-123',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: Money.create(1000),
      chargesAmount: Money.create(100),
      paymentDueDay: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingLease);

    const input = {
      id: 'lease-123',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: -100,
      chargesAmount: 100,
      paymentDueDay: 5,
    };

    await expect(updateLease.execute(input)).rejects.toThrow('Money amount cannot be negative');
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should throw error when paymentDueDay is invalid', async () => {
    const existingLease = Lease.create({
      id: 'lease-123',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: Money.create(1000),
      chargesAmount: Money.create(100),
      paymentDueDay: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingLease);

    const input = {
      id: 'lease-123',
      propertyId: 'property-1',
      tenantId: 'tenant-1',
      startDate: new Date('2024-01-01'),
      rentAmount: 1000,
      chargesAmount: 100,
      paymentDueDay: 35,
    };

    await expect(updateLease.execute(input)).rejects.toThrow('Payment due day must be between 1 and 31');
    expect(mockRepository.update).not.toHaveBeenCalled();
  });
});
