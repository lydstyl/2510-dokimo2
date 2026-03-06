import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateRentRevision } from '../UpdateRentRevision';
import { RentRevision, RentRevisionStatus } from '../../domain/RentRevision';
import { Money } from '@/domain/value-objects/Money';
import { IRentRevisionRepository } from '../interfaces/IRentRevisionRepository';

describe('UpdateRentRevision', () => {
  let mockRepository: IRentRevisionRepository;
  let useCase: UpdateRentRevision;
  let existingRevision: RentRevision;

  // Helper to get a future date
  const getFutureDate = (daysFromNow = 30) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  beforeEach(() => {
    // Create an existing revision
    existingRevision = RentRevision.create({
      id: 'revision-1',
      leaseId: 'lease-1',
      effectiveDate: getFutureDate(30),
      rentAmount: Money.create(800),
      chargesAmount: Money.create(60),
      reason: 'IRL_REVISION',
      status: RentRevisionStatus.EN_PREPARATION,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock repository
    mockRepository = {
      findById: async (id: string) => {
        if (id === existingRevision.id) {
          return existingRevision;
        }
        return null;
      },
      update: async (revision: RentRevision) => revision,
      findAll: async () => [],
      create: async (revision: RentRevision) => revision,
      delete: async (id: string) => {},
      findByLeaseId: async (leaseId: string) => [],
      findByStatus: async (status: any) => [],
      findUrgent: async () => [],
    };

    useCase = new UpdateRentRevision(mockRepository);
  });

  it('should update rent amount successfully', async () => {
    const result = await useCase.execute({
      id: 'revision-1',
      rentAmount: 850,
    });

    expect(result.rentAmount.getValue()).toBe(850);
    expect(result.chargesAmount.getValue()).toBe(60); // Unchanged
  });

  it('should update charges amount successfully', async () => {
    const result = await useCase.execute({
      id: 'revision-1',
      chargesAmount: 70,
    });

    expect(result.rentAmount.getValue()).toBe(800); // Unchanged
    expect(result.chargesAmount.getValue()).toBe(70);
  });

  it('should update effective date to a future date', async () => {
    const newDate = getFutureDate(60); // 60 days from now
    const result = await useCase.execute({
      id: 'revision-1',
      effectiveDate: newDate,
    });

    expect(result.effectiveDate).toEqual(newDate);
  });

  it('should allow updating effective date to a past date (retroactive modification)', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30); // 30 days ago
    const result = await useCase.execute({
      id: 'revision-1',
      effectiveDate: pastDate,
    });

    expect(result.effectiveDate).toEqual(pastDate);
    expect(result.status).toBe(RentRevisionStatus.EN_PREPARATION);
  });

  it('should update reason successfully', async () => {
    const result = await useCase.execute({
      id: 'revision-1',
      reason: 'CORRECTION_ADMINISTRATIVE',
    });

    expect(result.reason).toBe('CORRECTION_ADMINISTRATIVE');
  });

  it('should update multiple fields at once', async () => {
    const newDate = getFutureDate(90); // 90 days from now
    const result = await useCase.execute({
      id: 'revision-1',
      effectiveDate: newDate,
      rentAmount: 900,
      chargesAmount: 80,
      reason: 'MAJOR_REVISION',
    });

    expect(result.effectiveDate).toEqual(newDate);
    expect(result.rentAmount.getValue()).toBe(900);
    expect(result.chargesAmount.getValue()).toBe(80);
    expect(result.reason).toBe('MAJOR_REVISION');
  });

  it('should throw error if revision not found', async () => {
    await expect(
      useCase.execute({
        id: 'non-existent-id',
        rentAmount: 850,
      })
    ).rejects.toThrow('Rent revision with ID non-existent-id not found');
  });

  it('should throw error if trying to update a revision not in preparation', async () => {
    // Create a revision with COURRIER_AR_ENVOYE status
    const sentRevision = existingRevision.markAsLetterSent();
    mockRepository.findById = async () => sentRevision;

    await expect(
      useCase.execute({
        id: 'revision-1',
        rentAmount: 850,
      })
    ).rejects.toThrow('Cannot update a revision that is not in preparation');
  });

  it('should throw error if trying to update a cancelled revision', async () => {
    // Create a cancelled revision
    const cancelledRevision = existingRevision.cancel();
    mockRepository.findById = async () => cancelledRevision;

    await expect(
      useCase.execute({
        id: 'revision-1',
        rentAmount: 850,
      })
    ).rejects.toThrow('Cannot update a revision that is not in preparation');
  });
});
