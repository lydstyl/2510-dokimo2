import { randomUUID } from 'crypto';
import { Tenant, TenantType } from '../domain/entities/Tenant';
import { Email } from '../domain/value-objects/Email';
import { ITenantRepository } from './interfaces/ITenantRepository';

export interface CreateTenantInput {
  type: TenantType;
  civility?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  siret?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
}

export class CreateTenant {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(input: CreateTenantInput): Promise<Tenant> {
    const tenant = Tenant.create({
      id: randomUUID(),
      type: input.type,
      civility: input.civility,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ? Email.create(input.email) : undefined,
      phone: input.phone,
      siret: input.siret,
      managerName: input.managerName,
      managerEmail: input.managerEmail ? Email.create(input.managerEmail) : undefined,
      managerPhone: input.managerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.tenantRepository.create(tenant);
  }
}
