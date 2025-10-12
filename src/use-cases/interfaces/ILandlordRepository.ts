import { Landlord } from '../../domain/entities/Landlord';

export interface ILandlordRepository {
  findById(id: string): Promise<Landlord | null>;
  findByUserId(userId: string): Promise<Landlord[]>;
  create(landlord: Landlord): Promise<Landlord>;
  update(landlord: Landlord): Promise<Landlord>;
  delete(id: string): Promise<void>;
}
