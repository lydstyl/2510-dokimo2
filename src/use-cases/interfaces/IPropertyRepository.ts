import { Property } from '../../domain/entities/Property';

export interface IPropertyRepository {
  findById(id: string): Promise<Property | null>;
  findByLandlordId(landlordId: string): Promise<Property[]>;
  create(property: Property): Promise<Property>;
  update(property: Property): Promise<Property>;
  delete(id: string): Promise<void>;
}
