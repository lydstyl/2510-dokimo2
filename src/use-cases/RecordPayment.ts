import { Payment, PaymentType } from '../domain/entities/Payment';
import { Money } from '../domain/value-objects/Money';
import { IPaymentRepository } from './interfaces/IPaymentRepository';
import { randomUUID } from 'crypto';

export interface RecordPaymentInput {
  leaseId: string;
  amount: number;
  paymentDate: Date;
  periodStart: Date;
  periodEnd: Date;
  type: PaymentType;
  notes?: string;
}

export class RecordPayment {
  constructor(private paymentRepository: IPaymentRepository) {}

  async execute(input: RecordPaymentInput): Promise<Payment> {
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

    return this.paymentRepository.create(payment);
  }
}
