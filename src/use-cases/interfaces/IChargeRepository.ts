import { Charge } from '../../domain/entities/Charge';

export interface IChargeRepository {
  findById(id: string): Promise<Charge | null>;
  findByLeaseId(leaseId: string): Promise<Charge[]>;
  create(charge: Charge): Promise<Charge>;
  update(charge: Charge): Promise<Charge>;
  delete(id: string): Promise<void>;
}
