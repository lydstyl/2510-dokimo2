import { Tenant } from '../domain/entities/Tenant';
import { Email } from '../domain/value-objects/Email';
import { ITenantRepository } from './interfaces/ITenantRepository';

export interface UpdateTenantInput {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export class UpdateTenant {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(input: UpdateTenantInput): Promise<Tenant> {
    const existingTenant = await this.tenantRepository.findById(input.id);

    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = Tenant.create({
      id: input.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ? Email.create(input.email) : undefined,
      phone: input.phone,
      createdAt: existingTenant.createdAt,
      updatedAt: new Date(),
    });

    return this.tenantRepository.update(updatedTenant);
  }
}
