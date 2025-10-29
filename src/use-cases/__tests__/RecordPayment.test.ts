import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordPayment } from '../RecordPayment';
import { IPaymentRepository } from '../interfaces/IPaymentRepository';
import { Payment } from '../../domain/entities/Payment';
import { Money } from '../../domain/value-objects/Money';

describe('RecordPayment', () => {
  let mockRepository: IPaymentRepository;
  let useCase: RecordPayment;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByLeaseId: vi.fn(),
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
      notes: 'Full payment',
    };

    const expectedPayment = Payment.create({
      id: 'payment-1',
      leaseId: input.leaseId,
      amount: Money.create(input.amount),
      paymentDate: input.paymentDate,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(expectedPayment);

    const result = await useCase.execute(input);

    expect(result.leaseId).toBe(input.leaseId);
    expect(result.amount.getValue()).toBe(1100);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should record payment without notes', async () => {
    const input = {
      leaseId: 'lease-1',
      amount: 500,
      paymentDate: new Date('2024-03-05'),
    };

    const expectedPayment = Payment.create({
      id: 'payment-1',
      leaseId: input.leaseId,
      amount: Money.create(input.amount),
      paymentDate: input.paymentDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(expectedPayment);

    const result = await useCase.execute(input);

    expect(result.amount.getValue()).toBe(500);
    expect(result.notes).toBeUndefined();
  });

  it('should record partial payment with notes', async () => {
    const input = {
      leaseId: 'lease-1',
      amount: 500,
      paymentDate: new Date('2024-03-05'),
      notes: 'Partial payment received',
    };

    const expectedPayment = Payment.create({
      id: 'payment-1',
      leaseId: input.leaseId,
      amount: Money.create(input.amount),
      paymentDate: input.paymentDate,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(expectedPayment);

    const result = await useCase.execute(input);

    expect(result.notes).toBe('Partial payment received');
  });
});
