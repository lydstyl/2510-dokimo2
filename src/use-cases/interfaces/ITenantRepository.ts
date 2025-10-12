import { Tenant } from '../../domain/entities/Tenant';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
  create(tenant: Tenant): Promise<Tenant>;
  update(tenant: Tenant): Promise<Tenant>;
  delete(id: string): Promise<void>;
}
