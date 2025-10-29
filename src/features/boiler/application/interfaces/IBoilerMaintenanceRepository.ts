import { BoilerMaintenance } from '../../domain/BoilerMaintenance';

export interface IBoilerMaintenanceRepository {
  findById(id: string): Promise<BoilerMaintenance | null>;
  findByBoilerId(boilerId: string): Promise<BoilerMaintenance[]>;
  findLatestByBoilerId(boilerId: string): Promise<BoilerMaintenance | null>;
  findAll(): Promise<BoilerMaintenance[]>;
  create(maintenance: BoilerMaintenance): Promise<BoilerMaintenance>;
  update(maintenance: BoilerMaintenance): Promise<BoilerMaintenance>;
  delete(id: string): Promise<void>;
}
