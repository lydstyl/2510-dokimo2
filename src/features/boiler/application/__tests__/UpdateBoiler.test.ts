import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateBoiler } from '../UpdateBoiler';
import { IBoilerRepository } from '../interfaces/IBoilerRepository';
import { Boiler } from '../../domain/Boiler';

describe('UpdateBoiler', () => {
  let mockRepository: IBoilerRepository;
  let updateBoiler: UpdateBoiler;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByPropertyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    updateBoiler = new UpdateBoiler(mockRepository);
  });

  it('should update a boiler', async () => {
    const existingBoiler = Boiler.create({
      id: 'boiler-1',
      propertyId: 'property-1',
      name: 'Old Name',
      notes: 'Old Notes',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });

    const updatedBoiler = Boiler.create({
      id: 'boiler-1',
      propertyId: 'property-1',
      name: 'New Name',
      notes: 'New Notes',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingBoiler);
    vi.mocked(mockRepository.update).mockResolvedValue(updatedBoiler);

    const result = await updateBoiler.execute({
      id: 'boiler-1',
      name: 'New Name',
      notes: 'New Notes',
    });

    expect(result.name).toBe('New Name');
    expect(result.notes).toBe('New Notes');
    expect(mockRepository.findById).toHaveBeenCalledWith('boiler-1');
    expect(mockRepository.update).toHaveBeenCalledOnce();
  });

  it('should throw error when boiler not found', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(
      updateBoiler.execute({
        id: 'non-existent',
        name: 'New Name',
      })
    ).rejects.toThrow('Boiler not found');
  });
});
