import { PrismaClient } from '@prisma/client';
import { Charge } from '../../domain/entities/Charge';
import { Money } from '../../domain/value-objects/Money';
import { IChargeRepository } from '../../use-cases/interfaces/IChargeRepository';

export class PrismaChargeRepository implements IChargeRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Charge | null> {
    const charge = await this.prisma.charge.findUnique({
      where: { id },
    });

    if (!charge) {
      return null;
    }

    return this.toDomain(charge);
  }

  async findByLeaseId(leaseId: string): Promise<Charge[]> {
    const charges = await this.prisma.charge.findMany({
      where: { leaseId },
      orderBy: { chargeDate: 'desc' },
    });

    return charges.map(charge => this.toDomain(charge));
  }

  async create(charge: Charge): Promise<Charge> {
    const created = await this.prisma.charge.create({
      data: {
        id: charge.id,
        leaseId: charge.leaseId,
        amount: charge.amount.getAmount(),
        chargeDate: charge.chargeDate,
        description: charge.description,
        createdAt: charge.createdAt,
        updatedAt: charge.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(charge: Charge): Promise<Charge> {
    const updated = await this.prisma.charge.update({
      where: { id: charge.id },
      data: {
        amount: charge.amount.getAmount(),
        chargeDate: charge.chargeDate,
        description: charge.description,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.charge.delete({
      where: { id },
    });
  }

  private toDomain(prismaCharge: any): Charge {
    return Charge.create({
      id: prismaCharge.id,
      leaseId: prismaCharge.leaseId,
      amount: Money.create(prismaCharge.amount),
      chargeDate: prismaCharge.chargeDate,
      description: prismaCharge.description || undefined,
      createdAt: prismaCharge.createdAt,
      updatedAt: prismaCharge.updatedAt,
    });
  }
}
