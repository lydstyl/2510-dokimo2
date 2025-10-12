import { PrismaClient } from '@prisma/client';
import { ITenantRepository } from '../../use-cases/interfaces/ITenantRepository';
import { Tenant } from '../../domain/entities/Tenant';
import { Email } from '../../domain/value-objects/Email';

export class PrismaTenantRepository implements ITenantRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) return null;

    return this.toDomain(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { lastName: 'asc' },
    });

    return tenants.map(tenant => this.toDomain(tenant));
  }

  async create(tenant: Tenant): Promise<Tenant> {
    const created = await this.prisma.tenant.create({
      data: {
        id: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email?.getValue(),
        phone: tenant.phone,
      },
    });

    return this.toDomain(created);
  }

  async update(tenant: Tenant): Promise<Tenant> {
    const updated = await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email?.getValue(),
        phone: tenant.phone,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({
      where: { id },
    });
  }

  private toDomain(raw: any): Tenant {
    return Tenant.create({
      id: raw.id,
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email ? Email.create(raw.email) : undefined,
      phone: raw.phone,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
