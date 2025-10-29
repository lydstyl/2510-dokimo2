import { Boiler } from '../domain/Boiler';
import { BoilerMaintenance } from '../domain/BoilerMaintenance';
import { IBoilerRepository } from './interfaces/IBoilerRepository';
import { IBoilerMaintenanceRepository } from './interfaces/IBoilerMaintenanceRepository';

export interface BoilerWithMaintenance {
  boiler: Boiler;
  latestMaintenance: BoilerMaintenance | null;
}

export class GetBoilersWithMaintenance {
  constructor(
    private boilerRepository: IBoilerRepository,
    private maintenanceRepository: IBoilerMaintenanceRepository
  ) {}

  async execute(propertyId: string): Promise<BoilerWithMaintenance[]> {
    const boilers = await this.boilerRepository.findByPropertyId(propertyId);

    const boilersWithMaintenance = await Promise.all(
      boilers.map(async (boiler) => {
        const latestMaintenance = await this.maintenanceRepository.findLatestByBoilerId(
          boiler.id
        );
        return {
          boiler,
          latestMaintenance,
        };
      })
    );

    return boilersWithMaintenance;
  }
}
