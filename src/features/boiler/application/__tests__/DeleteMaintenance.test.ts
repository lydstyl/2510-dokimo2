import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteMaintenance } from '../DeleteMaintenance';
import { IBoilerMaintenanceRepository } from '../interfaces/IBoilerMaintenanceRepository';
import { BoilerMaintenance } from '../../domain/BoilerMaintenance';

describe('DeleteMaintenance', () => {
  let mockRepository: IBoilerMaintenanceRepository;
  let deleteMaintenance: DeleteMaintenance;

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
    deleteMaintenance = new DeleteMaintenance(mockRepository);
  });

  it('should delete a maintenance record', async () => {
    const existingMaintenance = BoilerMaintenance.create({
      id: 'maint-1',
      boilerId: 'boiler-1',
      maintenanceDate: new Date('2024-01-01'),
      documentPath: '/uploads/doc.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingMaintenance);
    vi.mocked(mockRepository.delete).mockResolvedValue();

    await deleteMaintenance.execute('maint-1');

    expect(mockRepository.findById).toHaveBeenCalledWith('maint-1');
    expect(mockRepository.delete).toHaveBeenCalledWith('maint-1');
  });

  it('should throw error when maintenance not found', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(deleteMaintenance.execute('non-existent')).rejects.toThrow(
      'Maintenance record not found'
    );
  });
});
