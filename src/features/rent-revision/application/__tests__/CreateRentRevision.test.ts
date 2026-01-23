import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateRentRevision, CreateRentRevisionDto } from '../CreateRentRevision';
import { IRentRevisionRepository } from '../interfaces/IRentRevisionRepository';
import { RentRevisionStatus } from '../../domain/RentRevision';

describe('CreateRentRevision', () => {
  let mockRepository: IRentRevisionRepository;
  let useCase: CreateRentRevision;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByLeaseId: vi.fn(),
      findByStatus: vi.fn(),
      findAll: vi.fn(),
      findUrgent: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CreateRentRevision(mockRepository);
  });

  it('should create a rent revision successfully', async () => {
    const dto: CreateRentRevisionDto = {
      leaseId: 'lease-1',
      effectiveDate: new Date('2026-03-01'),
      rentAmount: 850,
      chargesAmount: 70,
      reason: 'IRL_REVISION',
    };

    vi.mocked(mockRepository.create).mockImplementation(async (revision) => revision);

    const result = await useCase.execute(dto);

    expect(result.leaseId).toBe('lease-1');
    expect(result.rentAmount.getValue()).toBe(850);
    expect(result.chargesAmount.getValue()).toBe(70);
    expect(result.status).toBe(RentRevisionStatus.EN_PREPARATION);
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should throw error if lease ID is empty', async () => {
    const dto: CreateRentRevisionDto = {
      leaseId: '',
      effectiveDate: new Date('2026-03-01'),
      rentAmount: 850,
      chargesAmount: 70,
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Lease ID is required');
  });

  it('should throw error if effective date is in the past', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dto: CreateRentRevisionDto = {
      leaseId: 'lease-1',
      effectiveDate: yesterday,
      rentAmount: 850,
      chargesAmount: 70,
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Effective date cannot be in the past');
  });

  it('should throw error if rent amount is negative', async () => {
    const dto: CreateRentRevisionDto = {
      leaseId: 'lease-1',
      effectiveDate: new Date('2026-03-01'),
      rentAmount: -100,
      chargesAmount: 70,
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Money amount cannot be negative');
  });
});
