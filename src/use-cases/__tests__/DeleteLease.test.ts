import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteLease } from '../DeleteLease';
import { ILeaseRepository } from '../interfaces/ILeaseRepository';
import { Lease } from '../../domain/entities/Lease';
import { Money } from '../../domain/value-objects/Money';

describe('DeleteLease', () => {
  let mockRepository: ILeaseRepository;
  let deleteLease: DeleteLease;

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
    deleteLease = new DeleteLease(mockRepository);
  });

  it('should delete an existing lease', async () => {
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
    vi.mocked(mockRepository.delete).mockResolvedValue();

    await deleteLease.execute('lease-123');

    expect(mockRepository.findById).toHaveBeenCalledWith('lease-123');
    expect(mockRepository.delete).toHaveBeenCalledWith('lease-123');
    expect(mockRepository.delete).toHaveBeenCalledOnce();
  });

  it('should throw error when lease not found', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(deleteLease.execute('non-existent-id')).rejects.toThrow(
      'Lease not found'
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});
