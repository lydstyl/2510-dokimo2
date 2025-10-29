import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetBoilersWithMaintenance } from '../GetBoilersWithMaintenance';
import { IBoilerRepository } from '../interfaces/IBoilerRepository';
import { IBoilerMaintenanceRepository } from '../interfaces/IBoilerMaintenanceRepository';
import { Boiler } from '../../domain/Boiler';
import { BoilerMaintenance } from '../../domain/BoilerMaintenance';

describe('GetBoilersWithMaintenance', () => {
  let mockBoilerRepository: IBoilerRepository;
  let mockMaintenanceRepository: IBoilerMaintenanceRepository;
  let getBoilersWithMaintenance: GetBoilersWithMaintenance;

  beforeEach(() => {
    mockBoilerRepository = {
      findById: vi.fn(),
      findByPropertyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockMaintenanceRepository = {
      findById: vi.fn(),
      findByBoilerId: vi.fn(),
      findLatestByBoilerId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    getBoilersWithMaintenance = new GetBoilersWithMaintenance(
      mockBoilerRepository,
      mockMaintenanceRepository
    );
  });

  it('should return boilers for a property with their latest maintenance', async () => {
    const boiler1 = Boiler.create({
      id: 'boiler-1',
      propertyId: 'property-1',
      name: 'Main Boiler',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const boiler2 = Boiler.create({
      id: 'boiler-2',
      propertyId: 'property-1',
      name: 'Secondary Boiler',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const maintenance1 = BoilerMaintenance.create({
      id: 'maint-1',
      boilerId: 'boiler-1',
      maintenanceDate: new Date('2024-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockBoilerRepository.findByPropertyId).mockResolvedValue([boiler1, boiler2]);
    vi.mocked(mockMaintenanceRepository.findLatestByBoilerId)
      .mockResolvedValueOnce(maintenance1)
      .mockResolvedValueOnce(null);

    const result = await getBoilersWithMaintenance.execute('property-1');

    expect(result).toHaveLength(2);
    expect(result[0].boiler).toBe(boiler1);
    expect(result[0].latestMaintenance).toBe(maintenance1);
    expect(result[1].boiler).toBe(boiler2);
    expect(result[1].latestMaintenance).toBeNull();
  });

  it('should return empty array when property has no boilers', async () => {
    vi.mocked(mockBoilerRepository.findByPropertyId).mockResolvedValue([]);

    const result = await getBoilersWithMaintenance.execute('property-1');

    expect(result).toHaveLength(0);
  });
});
