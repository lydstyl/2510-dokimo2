import { IBoilerMaintenanceRepository } from './interfaces/IBoilerMaintenanceRepository';

export class DeleteMaintenance {
  constructor(private maintenanceRepository: IBoilerMaintenanceRepository) {}

  async execute(id: string): Promise<void> {
    const existingMaintenance = await this.maintenanceRepository.findById(id);

    if (!existingMaintenance) {
      throw new Error('Maintenance record not found');
    }

    // Note: We do NOT delete the document file - we keep it for records
    await this.maintenanceRepository.delete(id);
  }
}
