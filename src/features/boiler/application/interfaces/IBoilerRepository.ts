import { Boiler } from '../../domain/Boiler';

export interface IBoilerRepository {
  findById(id: string): Promise<Boiler | null>;
  findByPropertyId(propertyId: string): Promise<Boiler[]>;
  create(boiler: Boiler): Promise<Boiler>;
  update(boiler: Boiler): Promise<Boiler>;
  delete(id: string): Promise<void>;
}
