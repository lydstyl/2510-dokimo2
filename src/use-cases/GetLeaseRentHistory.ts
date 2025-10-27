import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { ILeaseRepository } from './interfaces/ILeaseRepository';

export interface RentForMonth {
  month: string; // YYYY-MM format
  rentAmount: number;
  chargesAmount: number;
  totalAmount: number;
  revisionId?: string;
}

/**
 * Use case: Get rent history for a lease, calculating which revision applies to each month
 * This is used to recalculate monthly balances when rent changes
 */
export class GetLeaseRentHistory {
  constructor(
    private rentRevisionRepository: IRentRevisionRepository,
    private leaseRepository: ILeaseRepository
  ) {}

  async execute(leaseId: string, startMonth: string, endMonth: string): Promise<RentForMonth[]> {
    // Verify lease exists
    const lease = await this.leaseRepository.findById(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    // Get all rent revisions ordered by date
    const revisions = await this.rentRevisionRepository.findByLeaseIdOrderedByDate(leaseId);

    // Generate month list
    const months = this.generateMonthList(startMonth, endMonth);

    // For each month, find the applicable rent revision
    const rentHistory: RentForMonth[] = months.map(month => {
      const monthDate = new Date(`${month}-01`);

      // Find the most recent revision that is effective for this month
      let applicableRevision = null;
      for (const revision of revisions) {
        if (revision.isEffectiveForMonth(monthDate)) {
          applicableRevision = revision;
        } else {
          break; // Revisions are ordered, so we can stop here
        }
      }

      // If no revision found, use the lease's base amounts
      const rentAmount = applicableRevision
        ? applicableRevision.rentAmount.getValue()
        : lease.rentAmount.getValue();
      const chargesAmount = applicableRevision
        ? applicableRevision.chargesAmount.getValue()
        : lease.chargesAmount.getValue();

      return {
        month,
        rentAmount,
        chargesAmount,
        totalAmount: rentAmount + chargesAmount,
        revisionId: applicableRevision?.id,
      };
    });

    return rentHistory;
  }

  private generateMonthList(startMonth: string, endMonth: string): string[] {
    const months: string[] = [];
    const start = new Date(`${startMonth}-01`);
    const end = new Date(`${endMonth}-01`);

    const current = new Date(start);
    while (current <= end) {
      const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      months.push(yearMonth);
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }
}
