import { Lease } from '../../domain/entities/Lease';

export interface ILeaseRepository {
  findById(id: string): Promise<Lease | null>;
  findByPropertyId(propertyId: string): Promise<Lease[]>;
  findByTenantId(tenantId: string): Promise<Lease[]>;
  findActiveLeases(): Promise<Lease[]>;
  create(lease: Lease): Promise<Lease>;
  update(lease: Lease): Promise<Lease>;
  delete(id: string): Promise<void>;
}
