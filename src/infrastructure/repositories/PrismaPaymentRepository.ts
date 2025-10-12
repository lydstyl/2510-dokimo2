import { PrismaClient } from '@prisma/client';
import { IPaymentRepository } from '../../use-cases/interfaces/IPaymentRepository';
import { Payment, PaymentType } from '../../domain/entities/Payment';
import { Money } from '../../domain/value-objects/Money';

export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) return null;

    return this.toDomain(payment);
  }

  async findByLeaseId(leaseId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: { leaseId },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map(payment => this.toDomain(payment));
  }

  async findByLeaseIdAndPeriod(
    leaseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        leaseId,
        periodStart: { lte: endDate },
        periodEnd: { gte: startDate },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map(payment => this.toDomain(payment));
  }

  async create(payment: Payment): Promise<Payment> {
    const created = await this.prisma.payment.create({
      data: {
        id: payment.id,
        leaseId: payment.leaseId,
        amount: payment.amount.getValue(),
        paymentDate: payment.paymentDate,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        type: payment.type,
        notes: payment.notes,
      },
    });

    return this.toDomain(created);
  }

  async update(payment: Payment): Promise<Payment> {
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        amount: payment.amount.getValue(),
        paymentDate: payment.paymentDate,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        type: payment.type,
        notes: payment.notes,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.payment.delete({
      where: { id },
    });
  }

  private toDomain(raw: any): Payment {
    return Payment.create({
      id: raw.id,
      leaseId: raw.leaseId,
      amount: Money.create(raw.amount),
      paymentDate: raw.paymentDate,
      periodStart: raw.periodStart,
      periodEnd: raw.periodEnd,
      type: raw.type as PaymentType,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
