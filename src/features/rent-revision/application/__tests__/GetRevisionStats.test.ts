import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetRevisionStats } from '../GetRevisionStats';
import { IRentRevisionRepository } from '../interfaces/IRentRevisionRepository';
import { RentRevision, RentRevisionStatus } from '../../domain/RentRevision';
import { Money } from '@/domain/value-objects/Money';

describe('GetRevisionStats', () => {
  let mockRepository: IRentRevisionRepository;
  let useCase: GetRevisionStats;

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
    useCase = new GetRevisionStats(mockRepository);
  });

  it('should return correct stats with urgent and pending revisions', async () => {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const urgentRevision = RentRevision.create({
      id: 'rev-1',
      leaseId: 'lease-1',
      effectiveDate: oneMonthFromNow,
      rentAmount: Money.create(850),
      chargesAmount: Money.create(70),
      status: RentRevisionStatus.EN_PREPARATION,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const upcomingRevision = RentRevision.create({
      id: 'rev-2',
      leaseId: 'lease-2',
      effectiveDate: threeMonthsFromNow,
      rentAmount: Money.create(900),
      chargesAmount: Money.create(80),
      status: RentRevisionStatus.EN_PREPARATION,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sentRevision = RentRevision.create({
      id: 'rev-3',
      leaseId: 'lease-3',
      effectiveDate: oneMonthFromNow,
      rentAmount: Money.create(920),
      chargesAmount: Money.create(85),
      status: RentRevisionStatus.COURRIER_AR_ENVOYE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock findByStatus to return different results based on status
    vi.mocked(mockRepository.findByStatus).mockImplementation(async (status) => {
      if (status === RentRevisionStatus.EN_PREPARATION) {
        return [urgentRevision, upcomingRevision];
      } else if (status === RentRevisionStatus.COURRIER_AR_ENVOYE) {
        return [sentRevision];
      }
      return [];
    });

    const stats = await useCase.execute();

    expect(stats.urgentCount).toBe(1);
    expect(stats.enPreparationCount).toBe(2);
    expect(stats.courrierEnvoyeCount).toBe(1);
    expect(stats.upcomingCount).toBe(1);
  });

  it('should return zero counts when no revisions exist', async () => {
    vi.mocked(mockRepository.findByStatus).mockResolvedValue([]);

    const stats = await useCase.execute();

    expect(stats.urgentCount).toBe(0);
    expect(stats.enPreparationCount).toBe(0);
    expect(stats.courrierEnvoyeCount).toBe(0);
    expect(stats.upcomingCount).toBe(0);
  });

  it('should not count COURRIER_AR_ENVOYE or CANCELLED revisions in preparation stats', async () => {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const sentRevision = RentRevision.create({
      id: 'rev-1',
      leaseId: 'lease-1',
      effectiveDate: oneMonthFromNow,
      rentAmount: Money.create(850),
      chargesAmount: Money.create(70),
      status: RentRevisionStatus.COURRIER_AR_ENVOYE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock to return sent revision when querying COURRIER_AR_ENVOYE
    vi.mocked(mockRepository.findByStatus).mockImplementation(async (status) => {
      if (status === RentRevisionStatus.COURRIER_AR_ENVOYE) {
        return [sentRevision];
      }
      return [];
    });

    const stats = await useCase.execute();

    expect(stats.urgentCount).toBe(0);
    expect(stats.enPreparationCount).toBe(0);
    expect(stats.courrierEnvoyeCount).toBe(1);
  });
});
