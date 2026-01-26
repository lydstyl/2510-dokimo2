import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateOrUpdateRentOverride, CreateOrUpdateRentOverrideDto } from '../CreateOrUpdateRentOverride';
import { ILeaseRentOverrideRepository } from '../interfaces/ILeaseRentOverrideRepository';
import { LeaseRentOverride } from '../../domain/LeaseRentOverride';
import { Money } from '@/domain/value-objects/Money';

describe('CreateOrUpdateRentOverride', () => {
  let mockRepository: ILeaseRentOverrideRepository;
  let useCase: CreateOrUpdateRentOverride;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByLeaseIdAndMonth: vi.fn(),
      findAllByLeaseId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CreateOrUpdateRentOverride(mockRepository);
  });

  it('should create a new override when none exists', async () => {
    const dto: CreateOrUpdateRentOverrideDto = {
      leaseId: 'lease-1',
      month: '2025-09',
      rentAmount: 850,
      chargesAmount: 70,
      reason: 'Correction historique',
    };

    vi.mocked(mockRepository.findByLeaseIdAndMonth).mockResolvedValue(null);
    vi.mocked(mockRepository.create).mockImplementation(async (override) => override);

    const result = await useCase.execute(dto);

    expect(result.leaseId).toBe('lease-1');
    expect(result.month).toBe('2025-09');
    expect(result.rentAmount.getValue()).toBe(850);
    expect(result.chargesAmount.getValue()).toBe(70);
    expect(result.reason).toBe('Correction historique');
    expect(mockRepository.create).toHaveBeenCalledOnce();
  });

  it('should update existing override when one exists', async () => {
    const dto: CreateOrUpdateRentOverrideDto = {
      leaseId: 'lease-1',
      month: '2025-09',
      rentAmount: 900, // changed
      chargesAmount: 80, // changed
      reason: 'Nouvelle raison',
    };

    const existing = LeaseRentOverride.create({
      id: 'override-1',
      leaseId: 'lease-1',
      month: '2025-09',
      rentAmount: Money.create(850),
      chargesAmount: Money.create(70),
      reason: 'Ancienne raison',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepository.findByLeaseIdAndMonth).mockResolvedValue(existing);
    vi.mocked(mockRepository.update).mockImplementation(async (override) => override);

    const result = await useCase.execute(dto);

    expect(result.leaseId).toBe('lease-1');
    expect(result.month).toBe('2025-09');
    expect(result.rentAmount.getValue()).toBe(900);
    expect(result.chargesAmount.getValue()).toBe(80);
    expect(result.reason).toBe('Nouvelle raison');
    expect(mockRepository.update).toHaveBeenCalledOnce();
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw error if month format is invalid', async () => {
    const dto: CreateOrUpdateRentOverrideDto = {
      leaseId: 'lease-1',
      month: '2025/09', // wrong format
      rentAmount: 850,
      chargesAmount: 70,
    };

    vi.mocked(mockRepository.findByLeaseIdAndMonth).mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow('Month must be in YYYY-MM format');
  });

  it('should throw error if rent amount is negative', async () => {
    const dto: CreateOrUpdateRentOverrideDto = {
      leaseId: 'lease-1',
      month: '2025-09',
      rentAmount: -100,
      chargesAmount: 70,
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Money amount cannot be negative');
  });

  it('should throw error if lease ID is empty', async () => {
    const dto: CreateOrUpdateRentOverrideDto = {
      leaseId: '',
      month: '2025-09',
      rentAmount: 850,
      chargesAmount: 70,
    };

    vi.mocked(mockRepository.findByLeaseIdAndMonth).mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow('Lease ID is required');
  });
});
