import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLandlord } from '../CreateLandlord';
import { ILandlordRepository } from '../interfaces/ILandlordRepository';
import { Landlord, LandlordType } from '../../domain/entities/Landlord';
import { Email } from '../../domain/value-objects/Email';

describe('CreateLandlord', () => {
  let mockRepository: ILandlordRepository;
  let useCase: CreateLandlord;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CreateLandlord(mockRepository);
  });

  it('should create a landlord successfully', async () => {
    const input = {
      name: 'John Doe',
      type: LandlordType.NATURAL_PERSON,
      address: '123 Main St',
      email: 'john@example.com',
      phone: '+33123456789',
      userId: 'user-1',
    };

    const expectedLandlord = Landlord.create({
      id: 'landlord-1',
      name: input.name,
      type: input.type,
      address: input.address,
      email: Email.create(input.email),
      phone: input.phone,
      userId: input.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(expectedLandlord);

    const result = await useCase.execute(input);

    expect(result.name).toBe(input.name);
    expect(result.type).toBe(input.type);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should throw error if name is empty', async () => {
    const input = {
      name: '',
      type: LandlordType.NATURAL_PERSON,
      address: '123 Main St',
      userId: 'user-1',
    };

    await expect(useCase.execute(input)).rejects.toThrow();
  });

  it('should require SIRET for legal entities', async () => {
    const input = {
      name: 'My SCI',
      type: LandlordType.LEGAL_ENTITY,
      address: '123 Main St',
      userId: 'user-1',
    };

    await expect(useCase.execute(input)).rejects.toThrow('SIRET is required for legal entities');
  });
});
