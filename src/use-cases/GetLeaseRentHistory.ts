import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { ILeaseRepository } from './interfaces/ILeaseRepository';
import { ILeaseRentOverrideRepository } from '@/features/rent-override/application/interfaces/ILeaseRentOverrideRepository';

export interface RentForMonth {
  month: string; // YYYY-MM format
  rentAmount: number;
  chargesAmount: number;
  totalAmount: number;
  revisionId?: string;
  overrideId?: string; // ID of override if one is used
  source: 'override' | 'revision' | 'base'; // where the rent amount comes from
}

/**
 * Use case: Get rent history for a lease, calculating which revision applies to each month
 * This is used to recalculate monthly balances when rent changes
 *
 * Priority order for determining rent amount:
 * 1. LeaseRentOverride (if exists for specific month) - highest priority
 * 2. RentRevision (if applicable for month)
 * 3. Lease base amounts (fallback)
 */
export class GetLeaseRentHistory {
  constructor(
    private rentRevisionRepository: IRentRevisionRepository,
    private leaseRepository: ILeaseRepository,
    private rentOverrideRepository: ILeaseRentOverrideRepository
  ) {}

  async execute(leaseId: string, startMonth: string, endMonth: string): Promise<RentForMonth[]> {
    // Verify lease exists
    const lease = await this.leaseRepository.findById(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    // Get all rent revisions ordered by date
    const revisions = await this.rentRevisionRepository.findByLeaseIdOrderedByDate(leaseId);

    // Get all rent overrides for this lease
    const overrides = await this.rentOverrideRepository.findAllByLeaseId(leaseId);
    const overridesByMonth = new Map(overrides.map(o => [o.month, o]));

    // Generate month list
    const months = this.generateMonthList(startMonth, endMonth);

    // For each month, determine rent amount with priority: override > revision > base
    const rentHistory: RentForMonth[] = months.map(month => {
      // Priority 1: Check for override for this specific month
      const override = overridesByMonth.get(month);
      if (override) {
        return {
          month,
          rentAmount: override.rentAmount.getValue(),
          chargesAmount: override.chargesAmount.getValue(),
          totalAmount: override.totalAmount().getValue(),
          overrideId: override.id,
          source: 'override' as const,
        };
      }

      // Priority 2: Find the most recent revision that is effective for this month
      const monthDate = new Date(`${month}-01`);
      let applicableRevision = null;
      for (const revision of revisions) {
        if (revision.isEffectiveForMonth(monthDate)) {
          applicableRevision = revision;
          // Continue to find the most recent effective revision
        }
      }

      if (applicableRevision) {
        const rentAmt = applicableRevision.rentAmount.getValue();
        const chargesAmt = applicableRevision.chargesAmount.getValue();
        return {
          month,
          rentAmount: rentAmt,
          chargesAmount: chargesAmt,
          totalAmount: rentAmt + chargesAmt,
          revisionId: applicableRevision.id,
          source: 'revision' as const,
        };
      }

      // Priority 3: Use the lease's base amounts
      return {
        month,
        rentAmount: lease.rentAmount.getValue(),
        chargesAmount: lease.chargesAmount.getValue(),
        totalAmount: lease.rentAmount.getValue() + lease.chargesAmount.getValue(),
        source: 'base' as const,
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
