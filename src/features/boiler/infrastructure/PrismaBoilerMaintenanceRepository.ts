import { PrismaClient } from '@prisma/client';
import { BoilerMaintenance } from '../domain/BoilerMaintenance';
import { IBoilerMaintenanceRepository } from '../application/interfaces/IBoilerMaintenanceRepository';

export class PrismaBoilerMaintenanceRepository implements IBoilerMaintenanceRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<BoilerMaintenance | null> {
    const maintenance = await this.prisma.boilerMaintenance.findUnique({
      where: { id },
    });

    if (!maintenance) return null;

    return this.toDomain(maintenance);
  }

  async findByBoilerId(boilerId: string): Promise<BoilerMaintenance[]> {
    const maintenances = await this.prisma.boilerMaintenance.findMany({
      where: { boilerId },
      orderBy: { maintenanceDate: 'desc' },
    });

    return maintenances.map((m) => this.toDomain(m));
  }

  async findLatestByBoilerId(boilerId: string): Promise<BoilerMaintenance | null> {
    const maintenance = await this.prisma.boilerMaintenance.findFirst({
      where: { boilerId },
      orderBy: { maintenanceDate: 'desc' },
    });

    if (!maintenance) return null;

    return this.toDomain(maintenance);
  }

  async findAll(): Promise<BoilerMaintenance[]> {
    const maintenances = await this.prisma.boilerMaintenance.findMany({
      orderBy: { maintenanceDate: 'desc' },
    });

    return maintenances.map((m) => this.toDomain(m));
  }

  async create(maintenance: BoilerMaintenance): Promise<BoilerMaintenance> {
    const created = await this.prisma.boilerMaintenance.create({
      data: {
        id: maintenance.id,
        boilerId: maintenance.boilerId,
        maintenanceDate: maintenance.maintenanceDate,
        documentPath: maintenance.documentPath,
        createdAt: maintenance.createdAt,
        updatedAt: maintenance.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(maintenance: BoilerMaintenance): Promise<BoilerMaintenance> {
    const updated = await this.prisma.boilerMaintenance.update({
      where: { id: maintenance.id },
      data: {
        maintenanceDate: maintenance.maintenanceDate,
        documentPath: maintenance.documentPath,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.boilerMaintenance.delete({
      where: { id },
    });
  }

  private toDomain(maintenance: {
    id: string;
    boilerId: string;
    maintenanceDate: Date;
    documentPath: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): BoilerMaintenance {
    return BoilerMaintenance.create({
      id: maintenance.id,
      boilerId: maintenance.boilerId,
      maintenanceDate: maintenance.maintenanceDate,
      documentPath: maintenance.documentPath ?? undefined,
      createdAt: maintenance.createdAt,
      updatedAt: maintenance.updatedAt,
    });
  }
}
