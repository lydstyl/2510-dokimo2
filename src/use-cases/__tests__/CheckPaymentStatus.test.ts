import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckPaymentStatus } from '../CheckPaymentStatus';
import { ILeaseRepository } from '../interfaces/ILeaseRepository';
import { IPaymentRepository } from '../interfaces/IPaymentRepository';
import { Lease } from '../../domain/entities/Lease';
import { Payment } from '../../domain/entities/Payment';
import { Money } from '../../domain/value-objects/Money';

describe('CheckPaymentStatus', () => {
  let mockLeaseRepository: ILeaseRepository;
  let mockPaymentRepository: IPaymentRepository;
  let useCase: CheckPaymentStatus;

  beforeEach(() => {
    mockLeaseRepository = {
      findById: vi.fn(),
      findByPropertyId: vi.fn(),
      findByTenantId: vi.fn(),
      findActiveLeases: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockPaymentRepository = {
      findById: vi.fn(),
      findByLeaseId: vi.fn(),
      findByLeaseIdAndPeriod: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CheckPaymentStatus(mockLeaseRepository, mockPaymentRepository);
  });

  it('should return up-to-date status when payment is made on time', async () => {
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

    const payment = Payment.create({
      id: 'payment-1',
      leaseId: 'lease-1',
      amount: Money.create(1100),
      paymentDate: new Date('2024-03-05'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockLeaseRepository.findById).mockResolvedValue(lease);
    vi.mocked(mockPaymentRepository.findByLeaseIdAndPeriod).mockResolvedValue([payment]);

    const result = await useCase.execute('lease-1', new Date('2024-03-15'));

    expect(result.isUpToDate).toBe(true);
    expect(result.isLate).toBe(false);
  });

  it('should return late status when payment is made after due date', async () => {
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

    const payment = Payment.create({
      id: 'payment-1',
      leaseId: 'lease-1',
      amount: Money.create(1100),
      paymentDate: new Date('2024-03-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockLeaseRepository.findById).mockResolvedValue(lease);
    vi.mocked(mockPaymentRepository.findByLeaseIdAndPeriod).mockResolvedValue([payment]);

    const result = await useCase.execute('lease-1', new Date('2024-03-20'));

    expect(result.isUpToDate).toBe(true);
    expect(result.isLate).toBe(true);
  });

  it('should return not up-to-date when no payment found', async () => {
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

    vi.mocked(mockLeaseRepository.findById).mockResolvedValue(lease);
    vi.mocked(mockPaymentRepository.findByLeaseIdAndPeriod).mockResolvedValue([]);

    const result = await useCase.execute('lease-1', new Date('2024-03-20'));

    expect(result.isUpToDate).toBe(false);
    expect(result.isLate).toBe(true);
  });

  it('should throw error if lease not found', async () => {
    vi.mocked(mockLeaseRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute('lease-1', new Date('2024-03-15'))).rejects.toThrow('Lease not found');
  });
});
