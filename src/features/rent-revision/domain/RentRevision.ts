import { Money } from '@/domain/value-objects/Money';

/**
 * Rent revision status enumeration
 */
export enum RentRevisionStatus {
  EN_PREPARATION = 'EN_PREPARATION',
  COURRIER_AR_ENVOYE = 'COURRIER_AR_ENVOYE',
  CANCELLED = 'CANCELLED',
}

/**
 * Props for creating a RentRevision entity
 */
export interface RentRevisionProps {
  id: string;
  leaseId: string;
  effectiveDate: Date;
  rentAmount: Money;
  chargesAmount: Money;
  reason?: string;
  status: RentRevisionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RentRevision domain entity
 * Represents a planned or executed rent revision for a lease
 *
 * Business rules:
 * - Effective date cannot be in the past (for NEW revisions only, via create())
 * - Lease ID is required
 * - Rent and charges must be valid Money value objects
 * - Status must be one of: EN_PREPARATION, COURRIER_AR_ENVOYE, CANCELLED
 * - A revision is "urgent" if effectiveDate is within 2 months and status is EN_PREPARATION
 */
export class RentRevision {
  readonly id: string;
  readonly leaseId: string;
  readonly effectiveDate: Date;
  readonly rentAmount: Money;
  readonly chargesAmount: Money;
  readonly reason?: string;
  readonly status: RentRevisionStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: RentRevisionProps) {
    this.id = props.id;
    this.leaseId = props.leaseId;
    this.effectiveDate = props.effectiveDate;
    this.rentAmount = props.rentAmount;
    this.chargesAmount = props.chargesAmount;
    this.reason = props.reason;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a NEW RentRevision entity
   * Validates all business rules including date in the future
   *
   * @param props - The rent revision properties
   * @param options - Optional configuration
   * @param options.allowPastDate - If true, allows effective dates in the past (for retroactive modifications)
   */
  static create(props: RentRevisionProps, options?: { allowPastDate?: boolean }): RentRevision {
    // Validation
    if (!props.leaseId || props.leaseId.trim() === '') {
      throw new Error('Lease ID is required');
    }

    // Validate effective date is not in the past (only for new revisions)
    // Skip this validation if explicitly allowed (for retroactive modifications)
    if (!options?.allowPastDate) {
      // We compare dates without time to allow today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const effectiveDate = new Date(props.effectiveDate);
      effectiveDate.setHours(0, 0, 0, 0);

      // Allow today and future dates, reject only past dates
      if (effectiveDate.getTime() < today.getTime()) {
        throw new Error('Effective date cannot be in the past');
      }
    }

    return new RentRevision(props);
  }

  /**
   * Factory method to reconstitute an EXISTING RentRevision entity from persistence
   * Does NOT validate date (allows past dates for existing revisions)
   */
  static reconstitute(props: RentRevisionProps): RentRevision {
    // Basic validation only
    if (!props.leaseId || props.leaseId.trim() === '') {
      throw new Error('Lease ID is required');
    }

    return new RentRevision(props);
  }

  /**
   * Calculate total rent amount (rent + charges)
   */
  totalAmount(): Money {
    return this.rentAmount.add(this.chargesAmount);
  }

  /**
   * Check if revision is in preparation
   */
  isInPreparation(): boolean {
    return this.status === RentRevisionStatus.EN_PREPARATION;
  }

  /**
   * Check if letter was sent
   */
  isLetterSent(): boolean {
    return this.status === RentRevisionStatus.COURRIER_AR_ENVOYE;
  }

  /**
   * Check if revision is urgent (within 2 months and in preparation)
   */
  isUrgent(): boolean {
    if (!this.isInPreparation()) {
      return false;
    }

    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    return this.effectiveDate <= twoMonthsFromNow && this.effectiveDate >= today;
  }

  /**
   * Mark revision letter as sent
   * Returns a new instance with updated status
   */
  markAsLetterSent(): RentRevision {
    return new RentRevision({
      ...this,
      status: RentRevisionStatus.COURRIER_AR_ENVOYE,
      updatedAt: new Date(),
    });
  }

  /**
   * Mark revision back to preparation (from sent status)
   * Returns a new instance with EN_PREPARATION status
   * Useful for reusing a sent revision for next year
   */
  markBackToPreparation(): RentRevision {
    return new RentRevision({
      ...this,
      status: RentRevisionStatus.EN_PREPARATION,
      updatedAt: new Date(),
    });
  }

  /**
   * Cancel revision
   * Returns a new instance with cancelled status
   */
  cancel(): RentRevision {
    return new RentRevision({
      ...this,
      status: RentRevisionStatus.CANCELLED,
      updatedAt: new Date(),
    });
  }

  /**
   * Update revision details
   * Returns a new instance with updated properties
   */
  update(props: Partial<Pick<RentRevisionProps, 'effectiveDate' | 'rentAmount' | 'chargesAmount' | 'reason'>>): RentRevision {
    return new RentRevision({
      ...this,
      ...props,
      updatedAt: new Date(),
    });
  }
}
