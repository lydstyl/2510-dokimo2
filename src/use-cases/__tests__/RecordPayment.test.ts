import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordPayment } from '../RecordPayment';
import { IPaymentRepository } from '../interfaces/IPaymentRepository';
import { Payment, PaymentType } from '../../domain/entities/Payment';
import { Money } from '../../domain/value-objects/Money';

describe('RecordPayment', () => {
  let mockRepository: IPaymentRepository;
  let useCase: RecordPayment;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByLeaseId: vi.fn(),
      findByLeaseIdAndPeriod: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new RecordPayment(mockRepository);
  });

  it('should record a payment successfully', async () => {
    const input = {
      leaseId: 'lease-1',
      amount: 1100,
      paymentDate: new Date('2024-03-05'),
      periodStart: new Date('2024-03-01'),
      periodEnd: new Date('2024-03-31'),
      type: PaymentType.FULL,
    };

    const expectedPayment = Payment.create({
      id: 'payment-1',
      leaseId: input.leaseId,
      amount: Money.create(input.amount),
      paymentDate: input.paymentDate,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      type: input.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(expectedPayment);

    const result = await useCase.execute(input);

    expect(result.leaseId).toBe(input.leaseId);
    expect(result.amount.getValue()).toBe(1100);
    expect(result.type).toBe(PaymentType.FULL);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should throw error if period end is before period start', async () => {
    const input = {
      leaseId: 'lease-1',
      amount: 1100,
      paymentDate: new Date('2024-03-05'),
      periodStart: new Date('2024-03-31'),
      periodEnd: new Date('2024-03-01'),
      type: PaymentType.FULL,
    };

    await expect(useCase.execute(input)).rejects.toThrow('Period end must be after period start');
  });

  it('should record partial payment', async () => {
    const input = {
      leaseId: 'lease-1',
      amount: 500,
      paymentDate: new Date('2024-03-05'),
      periodStart: new Date('2024-03-01'),
      periodEnd: new Date('2024-03-31'),
      type: PaymentType.PARTIAL,
      notes: 'Partial payment received',
    };

    const expectedPayment = Payment.create({
      id: 'payment-1',
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

    vi.mocked(mockRepository.create).mockResolvedValue(expectedPayment);

    const result = await useCase.execute(input);

    expect(result.type).toBe(PaymentType.PARTIAL);
    expect(result.notes).toBe('Partial payment received');
  });
});
