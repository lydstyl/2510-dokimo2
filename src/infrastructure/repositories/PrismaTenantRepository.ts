import { PrismaClient } from '@prisma/client';
import { ITenantRepository } from '../../use-cases/interfaces/ITenantRepository';
import { Tenant, TenantType } from '../../domain/entities/Tenant';
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
      orderBy: { firstName: 'asc' },
    });

    return tenants.map(tenant => this.toDomain(tenant));
  }

  async create(tenant: Tenant): Promise<Tenant> {
    const created = await this.prisma.tenant.create({
      data: {
        id: tenant.id,
        type: tenant.type,
        civility: tenant.civility,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email?.getValue(),
        phone: tenant.phone,
        siret: tenant.siret,
        managerName: tenant.managerName,
        managerEmail: tenant.managerEmail?.getValue(),
        managerPhone: tenant.managerPhone,
        note: tenant.note,
      },
    });

    return this.toDomain(created);
  }

  async update(tenant: Tenant): Promise<Tenant> {
    const updated = await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        type: tenant.type,
        civility: tenant.civility,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email?.getValue(),
        phone: tenant.phone,
        siret: tenant.siret,
        managerName: tenant.managerName,
        managerEmail: tenant.managerEmail?.getValue(),
        managerPhone: tenant.managerPhone,
        note: tenant.note,
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
      type: raw.type as TenantType,
      civility: raw.civility,
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email ? Email.create(raw.email) : undefined,
      phone: raw.phone,
      siret: raw.siret,
      managerName: raw.managerName,
      managerEmail: raw.managerEmail ? Email.create(raw.managerEmail) : undefined,
      managerPhone: raw.managerPhone,
      note: raw.note,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
