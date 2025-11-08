import { Tenant, TenantType } from '../domain/entities/Tenant';
import { Email } from '../domain/value-objects/Email';
import { ITenantRepository } from './interfaces/ITenantRepository';

export interface UpdateTenantInput {
  id: string;
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

export class UpdateTenant {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(input: UpdateTenantInput): Promise<Tenant> {
    const existingTenant = await this.tenantRepository.findById(input.id);

    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = Tenant.create({
      id: input.id,
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
      createdAt: existingTenant.createdAt,
      updatedAt: new Date(),
    });

    return this.tenantRepository.update(updatedTenant);
  }
}
