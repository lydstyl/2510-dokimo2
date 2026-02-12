import { IBoilerRepository } from './interfaces/IBoilerRepository';
import { IBoilerMaintenanceRepository } from './interfaces/IBoilerMaintenanceRepository';

/**
 * Statistics about boiler maintenance for dashboard display
 */
export interface BoilerOverdueStats {
  overdueCount: number;         // Boilers with maintenance older than 11 months
  noMaintenanceCount: number;   // Boilers with no maintenance record at all
  totalAttentionNeeded: number; // overdueCount + noMaintenanceCount
}

/**
 * Use case: Get boiler overdue maintenance statistics
 * Used by dashboard to show indicator on the boilers card
 */
export class GetBoilerOverdueStats {
  constructor(
    private boilerRepository: IBoilerRepository,
    private maintenanceRepository: IBoilerMaintenanceRepository
  ) {}

  async execute(): Promise<BoilerOverdueStats> {
    const boilers = await this.boilerRepository.findAll();

    let overdueCount = 0;
    let noMaintenanceCount = 0;

    await Promise.all(
      boilers.map(async (boiler) => {
        const latestMaintenance = await this.maintenanceRepository.findLatestByBoilerId(boiler.id);

        if (!latestMaintenance) {
          noMaintenanceCount++;
        } else if (latestMaintenance.isOverdue()) {
          overdueCount++;
        }
      })
    );

    return {
      overdueCount,
      noMaintenanceCount,
      totalAttentionNeeded: overdueCount + noMaintenanceCount,
    };
  }
}
