import { PrismaClient } from '@prisma/client';
import { ILeaseRepository } from '../../use-cases/interfaces/ILeaseRepository';
import { Lease } from '../../domain/entities/Lease';
import { Money } from '../../domain/value-objects/Money';

export class PrismaLeaseRepository implements ILeaseRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Lease | null> {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
    });

    if (!lease) return null;

    return this.toDomain(lease);
  }

  async findByPropertyId(propertyId: string): Promise<Lease[]> {
    const leases = await this.prisma.lease.findMany({
      where: { propertyId },
      orderBy: { startDate: 'desc' },
    });

    return leases.map(lease => this.toDomain(lease));
  }

  async findByTenantId(tenantId: string): Promise<Lease[]> {
    const leases = await this.prisma.lease.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });

    return leases.map(lease => this.toDomain(lease));
  }

  async findActiveLeases(): Promise<Lease[]> {
    const now = new Date();
    const leases = await this.prisma.lease.findMany({
      where: {
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { startDate: 'desc' },
    });

    return leases.map(lease => this.toDomain(lease));
  }

  async create(lease: Lease): Promise<Lease> {
    const created = await this.prisma.lease.create({
      data: {
        id: lease.id,
        propertyId: lease.propertyId,
        tenantId: lease.tenantId,
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount.getValue(),
        chargesAmount: lease.chargesAmount.getValue(),
        paymentDueDay: lease.paymentDueDay,
        irlQuarter: lease.irlQuarter,
      },
    });

    return this.toDomain(created);
  }

  async update(lease: Lease): Promise<Lease> {
    const updated = await this.prisma.lease.update({
      where: { id: lease.id },
      data: {
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount.getValue(),
        chargesAmount: lease.chargesAmount.getValue(),
        paymentDueDay: lease.paymentDueDay,
        irlQuarter: lease.irlQuarter,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lease.delete({
      where: { id },
    });
  }

  private toDomain(raw: any): Lease {
    return Lease.create({
      id: raw.id,
      propertyId: raw.propertyId,
      tenantId: raw.tenantId,
      startDate: raw.startDate,
      endDate: raw.endDate,
      rentAmount: Money.create(raw.rentAmount),
      chargesAmount: Money.create(raw.chargesAmount),
      paymentDueDay: raw.paymentDueDay,
      irlQuarter: raw.irlQuarter,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
