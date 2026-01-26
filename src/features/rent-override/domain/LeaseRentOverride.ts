import { Money } from '@/domain/value-objects/Money';

/**
 * Props for creating a LeaseRentOverride entity
 */
export interface LeaseRentOverrideProps {
  id: string;
  leaseId: string;
  month: string; // YYYY-MM format
  rentAmount: Money;
  chargesAmount: Money;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LeaseRentOverride domain entity
 * Represents an ad-hoc rent adjustment for a specific month in payment history
 *
 * This is INDEPENDENT from RentRevision system:
 * - RentRevision = Formal rent changes (IRL, agreements) with workflow and status
 * - LeaseRentOverride = Simple corrections for payment history display
 *
 * Business rules:
 * - Lease ID is required
 * - Month must be in YYYY-MM format
 * - One override per lease per month (enforced by database unique constraint)
 * - Rent and charges must be valid Money value objects
 *
 * Priority in GetLeaseRentHistory:
 * 1. LeaseRentOverride (if exists for month)
 * 2. RentRevision (if applicable for month)
 * 3. Lease base amounts
 */
export class LeaseRentOverride {
  readonly id: string;
  readonly leaseId: string;
  readonly month: string;
  readonly rentAmount: Money;
  readonly chargesAmount: Money;
  readonly reason?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: LeaseRentOverrideProps) {
    this.id = props.id;
    this.leaseId = props.leaseId;
    this.month = props.month;
    this.rentAmount = props.rentAmount;
    this.chargesAmount = props.chargesAmount;
    this.reason = props.reason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a NEW LeaseRentOverride entity
   * Validates all business rules
   */
  static create(props: LeaseRentOverrideProps): LeaseRentOverride {
    // Validation
    if (!props.leaseId || props.leaseId.trim() === '') {
      throw new Error('Lease ID is required');
    }

    if (!props.month || props.month.trim() === '') {
      throw new Error('Month is required');
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(props.month)) {
      throw new Error('Month must be in YYYY-MM format');
    }

    return new LeaseRentOverride(props);
  }

  /**
   * Factory method to reconstitute an EXISTING LeaseRentOverride entity from persistence
   * Does NOT validate (allows loading existing data)
   */
  static reconstitute(props: LeaseRentOverrideProps): LeaseRentOverride {
    return new LeaseRentOverride(props);
  }

  /**
   * Calculate total rent amount (rent + charges)
   */
  totalAmount(): Money {
    return this.rentAmount.add(this.chargesAmount);
  }

  /**
   * Update override details
   * Returns a new instance with updated properties
   */
  update(props: Partial<Pick<LeaseRentOverrideProps, 'rentAmount' | 'chargesAmount' | 'reason'>>): LeaseRentOverride {
    return new LeaseRentOverride({
      ...this,
      ...props,
      updatedAt: new Date(),
    });
  }
}
