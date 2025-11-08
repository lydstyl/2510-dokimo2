import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateTenant } from '../CreateTenant';
import { ITenantRepository } from '../interfaces/ITenantRepository';
import { Tenant } from '../../domain/entities/Tenant';
import { Email } from '../../domain/value-objects/Email';

describe('CreateTenant', () => {
  let mockRepository: ITenantRepository;
  let createTenant: CreateTenant;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    createTenant = new CreateTenant(mockRepository);
  });

  it('should create a tenant with valid data', async () => {
    const input = {
      type: 'NATURAL_PERSON' as const,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '0612345678',
    };

    const mockTenant = Tenant.create({
      id: 'tenant-123',
      type: 'NATURAL_PERSON',
      firstName: input.firstName,
      lastName: input.lastName,
      email: Email.create(input.email),
      phone: input.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(mockTenant);

    const result = await createTenant.execute(input);

    expect(result).toBe(mockTenant);
    expect(mockRepository.create).toHaveBeenCalledOnce();
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: input.firstName,
        lastName: input.lastName,
      })
    );
  });

  it('should create a tenant without email and phone', async () => {
    const input = {
      type: 'NATURAL_PERSON' as const,
      firstName: 'Marie',
      lastName: 'Martin',
    };

    const mockTenant = Tenant.create({
      id: 'tenant-456',
      type: 'NATURAL_PERSON',
      firstName: input.firstName,
      lastName: input.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.create).mockResolvedValue(mockTenant);

    const result = await createTenant.execute(input);

    expect(result).toBe(mockTenant);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should throw error when firstName is empty', async () => {
    const input = {
      type: 'NATURAL_PERSON' as const,
      firstName: '',
      lastName: 'Dupont',
    };

    await expect(createTenant.execute(input)).rejects.toThrow(
      'Tenant first name is required'
    );
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw error when lastName is empty', async () => {
    const input = {
      type: 'NATURAL_PERSON' as const,
      firstName: 'Jean',
      lastName: '',
    };

    await expect(createTenant.execute(input)).rejects.toThrow(
      'Tenant last name is required'
    );
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw error when email is invalid', async () => {
    const input = {
      type: 'NATURAL_PERSON' as const,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'invalid-email',
    };

    await expect(createTenant.execute(input)).rejects.toThrow('Invalid email format');
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});
