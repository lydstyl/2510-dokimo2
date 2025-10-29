import { Building } from '../../domain/Building';

export interface IBuildingRepository {
  findById(id: string): Promise<Building | null>;
  findAll(): Promise<Building[]>;
  create(building: Building): Promise<Building>;
  update(building: Building): Promise<Building>;
  delete(id: string): Promise<void>;
}
