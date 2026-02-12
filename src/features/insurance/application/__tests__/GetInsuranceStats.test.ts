import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetInsuranceStats } from '../GetInsuranceStats';
import { IInsuranceCertificateRepository } from '../interfaces/IInsuranceCertificateRepository';
import { InsuranceCertificate } from '../../domain/InsuranceCertificate';

const makeCertExpiredDaysAgo = (leaseId: string, daysExpiredAgo: number): InsuranceCertificate => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - daysExpiredAgo);
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1);
  return InsuranceCertificate.create({
    id: `cert-${leaseId}`,
    leaseId,
    startDate,
    endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

const makeCertValidDaysLeft = (leaseId: string, daysLeft: number): InsuranceCertificate => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysLeft);
  const startDate = new Date();
  return InsuranceCertificate.create({
    id: `cert-${leaseId}`,
    leaseId,
    startDate,
    endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

describe('GetInsuranceStats', () => {
  let mockRepository: IInsuranceCertificateRepository;
  let useCase: GetInsuranceStats;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByLeaseId: vi.fn(),
      findLatestByLeaseId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetInsuranceStats(mockRepository);
  });

  it('should return zero counts when there are no active leases', async () => {
    const stats = await useCase.execute([]);

    expect(stats.expiredCount).toBe(0);
    expect(stats.noInsuranceCount).toBe(0);
    expect(stats.totalAttentionNeeded).toBe(0);
  });

  it('should return zero counts when all leases have valid insurance', async () => {
    const validCert = makeCertValidDaysLeft('lease-1', 90);

    vi.mocked(mockRepository.findLatestByLeaseId).mockResolvedValue(validCert);

    const stats = await useCase.execute(['lease-1']);

    expect(stats.expiredCount).toBe(0);
    expect(stats.noInsuranceCount).toBe(0);
    expect(stats.totalAttentionNeeded).toBe(0);
  });

  it('should count leases with no insurance certificate', async () => {
    vi.mocked(mockRepository.findLatestByLeaseId).mockResolvedValue(null);

    const stats = await useCase.execute(['lease-1']);

    expect(stats.noInsuranceCount).toBe(1);
    expect(stats.expiredCount).toBe(0);
    expect(stats.totalAttentionNeeded).toBe(1);
  });

  it('should count leases with expired insurance', async () => {
    const expiredCert = makeCertExpiredDaysAgo('lease-1', 30);

    vi.mocked(mockRepository.findLatestByLeaseId).mockResolvedValue(expiredCert);

    const stats = await useCase.execute(['lease-1']);

    expect(stats.expiredCount).toBe(1);
    expect(stats.noInsuranceCount).toBe(0);
    expect(stats.totalAttentionNeeded).toBe(1);
  });

  it('should correctly handle a mix of lease insurance states', async () => {
    // lease-1: valid insurance
    // lease-2: expired insurance
    // lease-3: no insurance
    // lease-4: expired insurance

    const validCert = makeCertValidDaysLeft('lease-1', 180);
    const expiredCert1 = makeCertExpiredDaysAgo('lease-2', 10);
    const expiredCert2 = makeCertExpiredDaysAgo('lease-4', 60);

    vi.mocked(mockRepository.findLatestByLeaseId).mockImplementation(async (leaseId) => {
      if (leaseId === 'lease-1') return validCert;
      if (leaseId === 'lease-2') return expiredCert1;
      if (leaseId === 'lease-3') return null;
      if (leaseId === 'lease-4') return expiredCert2;
      return null;
    });

    const stats = await useCase.execute(['lease-1', 'lease-2', 'lease-3', 'lease-4']);

    expect(stats.expiredCount).toBe(2);
    expect(stats.noInsuranceCount).toBe(1);
    expect(stats.totalAttentionNeeded).toBe(3);
  });

  it('should compute totalAttentionNeeded as sum of expired and no-insurance counts', async () => {
    const expiredCert = makeCertExpiredDaysAgo('lease-1', 5);

    vi.mocked(mockRepository.findLatestByLeaseId).mockImplementation(async (leaseId) => {
      if (leaseId === 'lease-1') return expiredCert;
      return null; // lease-2 has no insurance
    });

    const stats = await useCase.execute(['lease-1', 'lease-2']);

    expect(stats.totalAttentionNeeded).toBe(stats.expiredCount + stats.noInsuranceCount);
    expect(stats.totalAttentionNeeded).toBe(2);
  });
});
