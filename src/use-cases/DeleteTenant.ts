import { ITenantRepository } from './interfaces/ITenantRepository';

export class DeleteTenant {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(id: string): Promise<void> {
    const existingTenant = await this.tenantRepository.findById(id);

    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    await this.tenantRepository.delete(id);
  }
}
