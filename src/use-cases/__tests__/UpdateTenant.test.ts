import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateTenant } from '../UpdateTenant';
import { ITenantRepository } from '../interfaces/ITenantRepository';
import { Tenant } from '../../domain/entities/Tenant';
import { Email } from '../../domain/value-objects/Email';

describe('UpdateTenant', () => {
  let mockRepository: ITenantRepository;
  let updateTenant: UpdateTenant;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    updateTenant = new UpdateTenant(mockRepository);
  });

  it('should update a tenant with valid data', async () => {
    const existingTenant = Tenant.create({
      id: 'tenant-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: Email.create('jean.dupont@example.com'),
      phone: '0612345678',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });

    const input = {
      id: 'tenant-123',
      firstName: 'Jean',
      lastName: 'Durand',
      email: 'jean.durand@example.com',
      phone: '0698765432',
    };

    const updatedTenant = Tenant.create({
      id: input.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: Email.create(input.email),
      phone: input.phone,
      createdAt: existingTenant.createdAt,
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingTenant);
    vi.mocked(mockRepository.update).mockResolvedValue(updatedTenant);

    const result = await updateTenant.execute(input);

    expect(result).toBe(updatedTenant);
    expect(mockRepository.findById).toHaveBeenCalledWith('tenant-123');
    expect(mockRepository.update).toHaveBeenCalledOnce();
  });

  it('should throw error when tenant not found', async () => {
    const input = {
      id: 'non-existent-id',
      firstName: 'Jean',
      lastName: 'Dupont',
    };

    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(updateTenant.execute(input)).rejects.toThrow('Tenant not found');
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should update tenant and remove email', async () => {
    const existingTenant = Tenant.create({
      id: 'tenant-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: Email.create('jean.dupont@example.com'),
      phone: '0612345678',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });

    const input = {
      id: 'tenant-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: undefined,
      phone: '0612345678',
    };

    const updatedTenant = Tenant.create({
      id: input.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: undefined,
      phone: input.phone,
      createdAt: existingTenant.createdAt,
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingTenant);
    vi.mocked(mockRepository.update).mockResolvedValue(updatedTenant);

    const result = await updateTenant.execute(input);

    expect(result.email).toBeUndefined();
    expect(mockRepository.update).toHaveBeenCalledOnce();
  });

  it('should throw error when firstName is empty', async () => {
    const existingTenant = Tenant.create({
      id: 'tenant-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingTenant);

    const input = {
      id: 'tenant-123',
      firstName: '',
      lastName: 'Dupont',
    };

    await expect(updateTenant.execute(input)).rejects.toThrow(
      'Tenant first name is required'
    );
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should throw error when email is invalid', async () => {
    const existingTenant = Tenant.create({
      id: 'tenant-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingTenant);

    const input = {
      id: 'tenant-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'invalid-email',
    };

    await expect(updateTenant.execute(input)).rejects.toThrow('Invalid email format');
    expect(mockRepository.update).not.toHaveBeenCalled();
  });
});
