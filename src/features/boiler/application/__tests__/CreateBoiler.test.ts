import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateBoiler } from '../CreateBoiler';
import { IBoilerRepository } from '../interfaces/IBoilerRepository';
import { Boiler } from '../../domain/Boiler';

describe('CreateBoiler', () => {
  let mockRepository: IBoilerRepository;
  let createBoiler: CreateBoiler;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByPropertyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    createBoiler = new CreateBoiler(mockRepository);
  });

  it('should create a boiler with name and notes', async () => {
    const input = {
      propertyId: 'property-1',
      name: 'Main Boiler',
      notes: 'Located in basement',
    };

    const mockBoiler = Boiler.create({
      id: 'boiler-1',
      propertyId: input.propertyId,
      name: input.name,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(mockBoiler);

    const result = await createBoiler.execute(input);

    expect(result.propertyId).toBe(input.propertyId);
    expect(result.name).toBe(input.name);
    expect(result.notes).toBe(input.notes);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should create a boiler without name and notes', async () => {
    const input = {
      propertyId: 'property-1',
    };

    const mockBoiler = Boiler.create({
      id: 'boiler-1',
      propertyId: input.propertyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(mockBoiler);

    const result = await createBoiler.execute(input);

    expect(result.propertyId).toBe(input.propertyId);
    expect(result.name).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should throw error when propertyId is missing', async () => {
    const input = {
      propertyId: '',
    };

    await expect(createBoiler.execute(input)).rejects.toThrow('Property id is required');
  });
});
