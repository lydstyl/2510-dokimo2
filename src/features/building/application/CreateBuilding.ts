import { randomUUID } from 'crypto';
import { Building } from '../domain/Building';
import { IBuildingRepository } from './interfaces/IBuildingRepository';

export interface CreateBuildingInput {
  name: string;
  address: string;
  postalCode: string;
  city: string;
}

export class CreateBuilding {
  constructor(private repository: IBuildingRepository) {}

  async execute(input: CreateBuildingInput): Promise<Building> {
    const building = Building.create({
      id: randomUUID(),
      name: input.name,
      address: input.address,
      postalCode: input.postalCode,
      city: input.city,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(building);
  }
}
