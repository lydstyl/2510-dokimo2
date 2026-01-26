import { PrismaClient } from '@prisma/client';
import { ILeaseRentOverrideRepository } from '../application/interfaces/ILeaseRentOverrideRepository';
import { LeaseRentOverride } from '../domain/LeaseRentOverride';
import { Money } from '@/domain/value-objects/Money';

/**
 * Prisma implementation of LeaseRentOverrideRepository
 */
export class PrismaLeaseRentOverrideRepository implements ILeaseRentOverrideRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<LeaseRentOverride | null> {
    const override = await this.prisma.leaseRentOverride.findUnique({
      where: { id },
    });

    if (!override) {
      return null;
    }

    return this.toDomain(override);
  }

  async findByLeaseIdAndMonth(leaseId: string, month: string): Promise<LeaseRentOverride | null> {
    const override = await this.prisma.leaseRentOverride.findUnique({
      where: {
        leaseId_month: {
          leaseId,
          month,
        },
      },
    });

    if (!override) {
      return null;
    }

    return this.toDomain(override);
  }

  async findAllByLeaseId(leaseId: string): Promise<LeaseRentOverride[]> {
    const overrides = await this.prisma.leaseRentOverride.findMany({
      where: { leaseId },
      orderBy: { month: 'asc' },
    });

    return overrides.map(o => this.toDomain(o));
  }

  async create(override: LeaseRentOverride): Promise<LeaseRentOverride> {
    const created = await this.prisma.leaseRentOverride.create({
      data: {
        id: override.id,
        leaseId: override.leaseId,
        month: override.month,
        rentAmount: override.rentAmount.getValue(),
        chargesAmount: override.chargesAmount.getValue(),
        reason: override.reason,
        createdAt: override.createdAt,
        updatedAt: override.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(override: LeaseRentOverride): Promise<LeaseRentOverride> {
    const updated = await this.prisma.leaseRentOverride.update({
      where: { id: override.id },
      data: {
        rentAmount: override.rentAmount.getValue(),
        chargesAmount: override.chargesAmount.getValue(),
        reason: override.reason,
        updatedAt: override.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.leaseRentOverride.delete({
      where: { id },
    });
  }

  private toDomain(prismaOverride: any): LeaseRentOverride {
    return LeaseRentOverride.reconstitute({
      id: prismaOverride.id,
      leaseId: prismaOverride.leaseId,
      month: prismaOverride.month,
      rentAmount: Money.create(prismaOverride.rentAmount),
      chargesAmount: Money.create(prismaOverride.chargesAmount),
      reason: prismaOverride.reason || undefined,
      createdAt: prismaOverride.createdAt,
      updatedAt: prismaOverride.updatedAt,
    });
  }
}
