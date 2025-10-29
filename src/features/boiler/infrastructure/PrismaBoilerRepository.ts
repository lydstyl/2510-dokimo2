import { PrismaClient } from '@prisma/client';
import { Boiler } from '../domain/Boiler';
import { IBoilerRepository } from '../application/interfaces/IBoilerRepository';

export class PrismaBoilerRepository implements IBoilerRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Boiler | null> {
    const boiler = await this.prisma.boiler.findUnique({
      where: { id },
    });

    if (!boiler) return null;

    return this.toDomain(boiler);
  }

  async findByPropertyId(propertyId: string): Promise<Boiler[]> {
    const boilers = await this.prisma.boiler.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    return boilers.map((b) => this.toDomain(b));
  }

  async create(boiler: Boiler): Promise<Boiler> {
    const created = await this.prisma.boiler.create({
      data: {
        id: boiler.id,
        propertyId: boiler.propertyId,
        name: boiler.name,
        notes: boiler.notes,
        createdAt: boiler.createdAt,
        updatedAt: boiler.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(boiler: Boiler): Promise<Boiler> {
    const updated = await this.prisma.boiler.update({
      where: { id: boiler.id },
      data: {
        name: boiler.name,
        notes: boiler.notes,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.boiler.delete({
      where: { id },
    });
  }

  private toDomain(boiler: {
    id: string;
    propertyId: string;
    name: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Boiler {
    return Boiler.create({
      id: boiler.id,
      propertyId: boiler.propertyId,
      name: boiler.name ?? undefined,
      notes: boiler.notes ?? undefined,
      createdAt: boiler.createdAt,
      updatedAt: boiler.updatedAt,
    });
  }
}
