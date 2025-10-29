import { BoilerMaintenance } from '../domain/BoilerMaintenance';
import { IBoilerMaintenanceRepository } from './interfaces/IBoilerMaintenanceRepository';
import { randomUUID } from 'crypto';

interface RecordMaintenanceInput {
  boilerId: string;
  maintenanceDate: Date;
  documentPath?: string;
}

export class RecordMaintenance {
  constructor(private maintenanceRepository: IBoilerMaintenanceRepository) {}

  async execute(input: RecordMaintenanceInput): Promise<BoilerMaintenance> {
    const now = new Date();

    const maintenance = BoilerMaintenance.create({
      id: randomUUID(),
      boilerId: input.boilerId,
      maintenanceDate: input.maintenanceDate,
      documentPath: input.documentPath,
      createdAt: now,
      updatedAt: now,
    });

    return await this.maintenanceRepository.create(maintenance);
  }
}
