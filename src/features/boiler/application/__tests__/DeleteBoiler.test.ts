import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteBoiler } from '../DeleteBoiler';
import { IBoilerRepository } from '../interfaces/IBoilerRepository';
import { Boiler } from '../../domain/Boiler';

describe('DeleteBoiler', () => {
  let mockRepository: IBoilerRepository;
  let deleteBoiler: DeleteBoiler;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByPropertyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    deleteBoiler = new DeleteBoiler(mockRepository);
  });

  it('should delete a boiler', async () => {
    const existingBoiler = Boiler.create({
      id: 'boiler-1',
      propertyId: 'property-1',
      name: 'Test Boiler',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingBoiler);
    vi.mocked(mockRepository.delete).mockResolvedValue();

    await deleteBoiler.execute('boiler-1');

    expect(mockRepository.findById).toHaveBeenCalledWith('boiler-1');
    expect(mockRepository.delete).toHaveBeenCalledWith('boiler-1');
  });

  it('should throw error when boiler not found', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(deleteBoiler.execute('non-existent')).rejects.toThrow('Boiler not found');
  });
});
