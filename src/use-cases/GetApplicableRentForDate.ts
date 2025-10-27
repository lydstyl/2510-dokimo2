import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { ILeaseRepository } from './interfaces/ILeaseRepository';

export interface ApplicableRent {
  rentAmount: number;
  chargesAmount: number;
  totalAmount: number;
  revisionId?: string;
  isFromRevision: boolean;
}

/**
 * Use case: Get the applicable rent amounts for a specific date
 * Takes into account rent revisions and returns the correct amounts
 */
export class GetApplicableRentForDate {
  constructor(
    private rentRevisionRepository: IRentRevisionRepository,
    private leaseRepository: ILeaseRepository
  ) {}

  async execute(leaseId: string, date: Date): Promise<ApplicableRent> {
    // Get lease base amounts
    const lease = await this.leaseRepository.findById(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    // Get all rent revisions for this lease, ordered by effective date
    const revisions = await this.rentRevisionRepository.findByLeaseIdOrderedByDate(leaseId);

    // Find the most recent revision that is effective for the given date
    let applicableRevision = null;
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    for (const revision of revisions) {
      const revisionDate = new Date(
        revision.effectiveDate.getFullYear(),
        revision.effectiveDate.getMonth(),
        revision.effectiveDate.getDate()
      );

      if (revisionDate <= targetDate) {
        applicableRevision = revision;
      } else {
        // Revisions are ordered, so we can stop here
        break;
      }
    }

    // Return applicable rent
    if (applicableRevision) {
      return {
        rentAmount: applicableRevision.rentAmount.getValue(),
        chargesAmount: applicableRevision.chargesAmount.getValue(),
        totalAmount: applicableRevision.totalAmount.getValue(),
        revisionId: applicableRevision.id,
        isFromRevision: true,
      };
    }

    // No revision found, use base lease amounts
    return {
      rentAmount: lease.rentAmount.getValue(),
      chargesAmount: lease.chargesAmount.getValue(),
      totalAmount: lease.totalAmount.getValue(),
      revisionId: undefined,
      isFromRevision: false,
    };
  }
}
