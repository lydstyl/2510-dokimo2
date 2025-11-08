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
      // Revisions are ordered by effectiveDate ascending, so we need to find
      // the last one that is effective for this month
      let applicableRevision = null;
      for (const revision of revisions) {
        if (revision.isEffectiveForMonth(monthDate)) {
          applicableRevision = revision;
          // Continue to find the most recent effective revision
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

    // Parse start and end months (YYYY-MM format)
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);

    // Use UTC to avoid DST issues
    const start = Date.UTC(startYear, startMonthNum - 1, 1);
    const end = Date.UTC(endYear, endMonthNum - 1, 1);

    let currentTimestamp = start;
    while (currentTimestamp <= end) {
      const currentDate = new Date(currentTimestamp);
      const yearMonth = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}`;
      months.push(yearMonth);

      // Move to next month using UTC to avoid DST issues
      const nextYear = currentDate.getUTCFullYear();
      const nextMonth = currentDate.getUTCMonth() + 1;
      currentTimestamp = Date.UTC(nextYear, nextMonth, 1);
    }

    return months;
  }
}
