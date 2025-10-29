import { PrismaClient } from '@prisma/client';
import { Building } from '../domain/Building';
import { IBuildingRepository } from '../application/interfaces/IBuildingRepository';

export class PrismaBuildingRepository implements IBuildingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Building | null> {
    const building = await this.prisma.building.findUnique({
      where: { id },
    });

    if (!building) return null;
    return this.toDomain(building);
  }

  async findAll(): Promise<Building[]> {
    const buildings = await this.prisma.building.findMany({
      orderBy: { name: 'asc' },
    });

    return buildings.map((b) => this.toDomain(b));
  }

  async create(building: Building): Promise<Building> {
    const created = await this.prisma.building.create({
      data: {
        id: building.id,
        name: building.name,
        address: building.address,
        postalCode: building.postalCode,
        city: building.city,
      },
    });

    return this.toDomain(created);
  }

  async update(building: Building): Promise<Building> {
    const updated = await this.prisma.building.update({
      where: { id: building.id },
      data: {
        name: building.name,
        address: building.address,
        postalCode: building.postalCode,
        city: building.city,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.building.delete({
      where: { id },
    });
  }

  private toDomain(prismaBuilding: any): Building {
    return Building.create({
      id: prismaBuilding.id,
      name: prismaBuilding.name,
      address: prismaBuilding.address,
      postalCode: prismaBuilding.postalCode,
      city: prismaBuilding.city,
      createdAt: prismaBuilding.createdAt,
      updatedAt: prismaBuilding.updatedAt,
    });
  }
}
