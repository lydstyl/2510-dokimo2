import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetBoilerOverdueStats } from '../GetBoilerOverdueStats';
import { IBoilerRepository } from '../interfaces/IBoilerRepository';
import { IBoilerMaintenanceRepository } from '../interfaces/IBoilerMaintenanceRepository';
import { Boiler } from '../../domain/Boiler';
import { BoilerMaintenance } from '../../domain/BoilerMaintenance';

const makeBoiler = (id: string): Boiler =>
  Boiler.create({
    id,
    propertyId: 'prop-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const makeMaintenanceDaysAgo = (boilerId: string, daysAgo: number): BoilerMaintenance => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return BoilerMaintenance.create({
    id: `maint-${boilerId}`,
    boilerId,
    maintenanceDate: date,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

describe('GetBoilerOverdueStats', () => {
  let mockBoilerRepository: IBoilerRepository;
  let mockMaintenanceRepository: IBoilerMaintenanceRepository;
  let useCase: GetBoilerOverdueStats;

  beforeEach(() => {
    mockBoilerRepository = {
      findById: vi.fn(),
      findByPropertyId: vi.fn(),
      findAll: vi.fn(),
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
    useCase = new GetBoilerOverdueStats(mockBoilerRepository, mockMaintenanceRepository);
  });

  it('should return zero counts when there are no boilers', async () => {
    vi.mocked(mockBoilerRepository.findAll).mockResolvedValue([]);

    const stats = await useCase.execute();

    expect(stats.overdueCount).toBe(0);
    expect(stats.noMaintenanceCount).toBe(0);
  });

  it('should return zero counts when all boilers have recent maintenance', async () => {
    const boiler = makeBoiler('b-1');
    // 5 months ago = recent (< 11 months)
    const recentMaintenance = makeMaintenanceDaysAgo('b-1', 150);

    vi.mocked(mockBoilerRepository.findAll).mockResolvedValue([boiler]);
    vi.mocked(mockMaintenanceRepository.findLatestByBoilerId).mockResolvedValue(recentMaintenance);

    const stats = await useCase.execute();

    expect(stats.overdueCount).toBe(0);
    expect(stats.noMaintenanceCount).toBe(0);
  });

  it('should count boilers with maintenance older than 11 months as overdue', async () => {
    const boiler = makeBoiler('b-1');
    // 340 days ago ≈ 11.3 months
    const overdueMaintenance = makeMaintenanceDaysAgo('b-1', 340);

    vi.mocked(mockBoilerRepository.findAll).mockResolvedValue([boiler]);
    vi.mocked(mockMaintenanceRepository.findLatestByBoilerId).mockResolvedValue(overdueMaintenance);

    const stats = await useCase.execute();

    expect(stats.overdueCount).toBe(1);
    expect(stats.noMaintenanceCount).toBe(0);
  });

  it('should count boilers with no maintenance record', async () => {
    const boiler = makeBoiler('b-1');

    vi.mocked(mockBoilerRepository.findAll).mockResolvedValue([boiler]);
    vi.mocked(mockMaintenanceRepository.findLatestByBoilerId).mockResolvedValue(null);

    const stats = await useCase.execute();

    expect(stats.overdueCount).toBe(0);
    expect(stats.noMaintenanceCount).toBe(1);
  });

  it('should correctly handle a mix of boiler states', async () => {
    const boiler1 = makeBoiler('b-1'); // recent
    const boiler2 = makeBoiler('b-2'); // overdue
    const boiler3 = makeBoiler('b-3'); // no maintenance
    const boiler4 = makeBoiler('b-4'); // overdue

    const recentMaintenance = makeMaintenanceDaysAgo('b-1', 90);   // 3 months ago
    const overdueMaintenance1 = makeMaintenanceDaysAgo('b-2', 340); // ~11.3 months ago
    const overdueMaintenance2 = makeMaintenanceDaysAgo('b-4', 400); // ~13 months ago

    vi.mocked(mockBoilerRepository.findAll).mockResolvedValue([boiler1, boiler2, boiler3, boiler4]);
    vi.mocked(mockMaintenanceRepository.findLatestByBoilerId).mockImplementation(
      async (boilerId) => {
        if (boilerId === 'b-1') return recentMaintenance;
        if (boilerId === 'b-2') return overdueMaintenance1;
        if (boilerId === 'b-3') return null;
        if (boilerId === 'b-4') return overdueMaintenance2;
        return null;
      }
    );

    const stats = await useCase.execute();

    expect(stats.overdueCount).toBe(2);
    expect(stats.noMaintenanceCount).toBe(1);
  });

  it('should return the total count of boilers needing attention', async () => {
    const boiler1 = makeBoiler('b-1'); // overdue
    const boiler2 = makeBoiler('b-2'); // no maintenance

    vi.mocked(mockBoilerRepository.findAll).mockResolvedValue([boiler1, boiler2]);
    vi.mocked(mockMaintenanceRepository.findLatestByBoilerId).mockImplementation(
      async (boilerId) => {
        if (boilerId === 'b-1') return makeMaintenanceDaysAgo('b-1', 340);
        return null;
      }
    );

    const stats = await useCase.execute();

    expect(stats.totalAttentionNeeded).toBe(2);
  });
});
