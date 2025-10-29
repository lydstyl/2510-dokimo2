import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordMaintenance } from '../RecordMaintenance';
import { IBoilerMaintenanceRepository } from '../interfaces/IBoilerMaintenanceRepository';
import { BoilerMaintenance } from '../../domain/BoilerMaintenance';

describe('RecordMaintenance', () => {
  let mockRepository: IBoilerMaintenanceRepository;
  let recordMaintenance: RecordMaintenance;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByBoilerId: vi.fn(),
      findLatestByBoilerId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    recordMaintenance = new RecordMaintenance(mockRepository);
  });

  it('should record maintenance with document path', async () => {
    const input = {
      boilerId: 'boiler-1',
      maintenanceDate: new Date('2024-01-15'),
      documentPath: '/uploads/invoice-2024-01.pdf',
    };

    const mockMaintenance = BoilerMaintenance.create({
      id: 'maint-1',
      boilerId: input.boilerId,
      maintenanceDate: input.maintenanceDate,
      documentPath: input.documentPath,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(mockMaintenance);

    const result = await recordMaintenance.execute(input);

    expect(result.boilerId).toBe(input.boilerId);
    expect(result.maintenanceDate).toBe(input.maintenanceDate);
    expect(result.documentPath).toBe(input.documentPath);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should record maintenance without document path', async () => {
    const input = {
      boilerId: 'boiler-1',
      maintenanceDate: new Date('2024-01-15'),
    };

    const mockMaintenance = BoilerMaintenance.create({
      id: 'maint-1',
      boilerId: input.boilerId,
      maintenanceDate: input.maintenanceDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(mockMaintenance);

    const result = await recordMaintenance.execute(input);

    expect(result.boilerId).toBe(input.boilerId);
    expect(result.documentPath).toBeUndefined();
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should throw error when boilerId is missing', async () => {
    const input = {
      boilerId: '',
      maintenanceDate: new Date(),
    };

    await expect(recordMaintenance.execute(input)).rejects.toThrow('Boiler id is required');
  });

  it('should throw error when maintenanceDate is in the future', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const input = {
      boilerId: 'boiler-1',
      maintenanceDate: futureDate,
    };

    await expect(recordMaintenance.execute(input)).rejects.toThrow(
      'Maintenance date cannot be in the future'
    );
  });
});
