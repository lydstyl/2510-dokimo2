import { randomUUID } from 'crypto';
import { Tenant } from '../domain/entities/Tenant';
import { Email } from '../domain/value-objects/Email';
import { ITenantRepository } from './interfaces/ITenantRepository';

export interface CreateTenantInput {
  civility?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export class CreateTenant {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(input: CreateTenantInput): Promise<Tenant> {
    const tenant = Tenant.create({
      id: randomUUID(),
      civility: input.civility,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ? Email.create(input.email) : undefined,
      phone: input.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.tenantRepository.create(tenant);
  }
}
