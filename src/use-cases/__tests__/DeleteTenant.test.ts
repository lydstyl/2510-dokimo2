import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteTenant } from '../DeleteTenant';
import { ITenantRepository } from '../interfaces/ITenantRepository';
import { Tenant } from '../../domain/entities/Tenant';
import { Email } from '../../domain/value-objects/Email';

describe('DeleteTenant', () => {
  let mockRepository: ITenantRepository;
  let deleteTenant: DeleteTenant;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    deleteTenant = new DeleteTenant(mockRepository);
  });

  it('should delete an existing tenant', async () => {
    const existingTenant = Tenant.create({
      type: 'NATURAL_PERSON',
      id: 'tenant-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: Email.create('jean.dupont@example.com'),
      phone: '0612345678',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findById).mockResolvedValue(existingTenant);
    vi.mocked(mockRepository.delete).mockResolvedValue();

    await deleteTenant.execute('tenant-123');

    expect(mockRepository.findById).toHaveBeenCalledWith('tenant-123');
    expect(mockRepository.delete).toHaveBeenCalledWith('tenant-123');
    expect(mockRepository.delete).toHaveBeenCalledOnce();
  });

  it('should throw error when tenant not found', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(deleteTenant.execute('non-existent-id')).rejects.toThrow(
      'Tenant not found'
    );
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});
