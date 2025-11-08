import { PrismaClient } from '@prisma/client';
import { ILeaseRepository } from '../../use-cases/interfaces/ILeaseRepository';
import { Lease } from '../../domain/entities/Lease';
import { Money } from '../../domain/value-objects/Money';

export class PrismaLeaseRepository implements ILeaseRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Lease | null> {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        tenants: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!lease) return null;

    return this.toDomain(lease);
  }

  async findByPropertyId(propertyId: string): Promise<Lease[]> {
    const leases = await this.prisma.lease.findMany({
      where: { propertyId },
      include: {
        tenants: {
          select: {
            tenantId: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return leases.map(lease => this.toDomain(lease));
  }

  async findByTenantId(tenantId: string): Promise<Lease[]> {
    const leases = await this.prisma.lease.findMany({
      where: {
        tenants: {
          some: {
            tenantId: tenantId,
          },
        },
      },
      include: {
        tenants: {
          select: {
            tenantId: true,
          },
        },
      },
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
      include: {
        tenants: {
          select: {
            tenantId: true,
          },
        },
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
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount.getValue(),
        chargesAmount: lease.chargesAmount.getValue(),
        paymentDueDay: lease.paymentDueDay,
        irlQuarter: lease.irlQuarter,
        tenants: {
          create: lease.tenantIds.map(tenantId => ({
            id: `${lease.id}_${tenantId}`,
            tenantId: tenantId,
          })),
        },
      },
      include: {
        tenants: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    return this.toDomain(created);
  }

  async update(lease: Lease): Promise<Lease> {
    // Delete existing tenant relationships and create new ones
    await this.prisma.leaseTenant.deleteMany({
      where: { leaseId: lease.id },
    });

    const updated = await this.prisma.lease.update({
      where: { id: lease.id },
      data: {
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount.getValue(),
        chargesAmount: lease.chargesAmount.getValue(),
        paymentDueDay: lease.paymentDueDay,
        irlQuarter: lease.irlQuarter,
        tenants: {
          create: lease.tenantIds.map(tenantId => ({
            id: `${lease.id}_${tenantId}`,
            tenantId: tenantId,
          })),
        },
      },
      include: {
        tenants: {
          select: {
            tenantId: true,
          },
        },
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
    const tenantIds = raw.tenants?.map((t: any) => t.tenantId) || [];

    return Lease.create({
      id: raw.id,
      propertyId: raw.propertyId,
      tenantIds: tenantIds,
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
