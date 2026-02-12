import { IInsuranceCertificateRepository } from './interfaces/IInsuranceCertificateRepository';

/**
 * Statistics about tenant insurance certificates for dashboard display
 */
export interface InsuranceStats {
  expiredCount: number;         // Active leases whose latest insurance certificate has expired
  noInsuranceCount: number;     // Active leases with no insurance certificate at all
  totalAttentionNeeded: number; // expiredCount + noInsuranceCount
}

/**
 * Use case: Get insurance certificate statistics for active leases
 * Used by dashboard to show indicator on the insurance card
 */
export class GetInsuranceStats {
  constructor(private repository: IInsuranceCertificateRepository) {}

  async execute(activeLeaseIds: string[]): Promise<InsuranceStats> {
    let expiredCount = 0;
    let noInsuranceCount = 0;

    await Promise.all(
      activeLeaseIds.map(async (leaseId) => {
        const latestCertificate = await this.repository.findLatestByLeaseId(leaseId);

        if (!latestCertificate) {
          noInsuranceCount++;
        } else if (latestCertificate.isExpired()) {
          expiredCount++;
        }
      })
    );

    return {
      expiredCount,
      noInsuranceCount,
      totalAttentionNeeded: expiredCount + noInsuranceCount,
    };
  }
}
