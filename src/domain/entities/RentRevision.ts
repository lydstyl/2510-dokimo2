import { Money } from '../value-objects/Money';

export interface RentRevisionProps {
  id: string;
  leaseId: string;
  effectiveDate: Date;
  rentAmount: Money;
  chargesAmount: Money;
  reason?: string;
  createdAt: Date;
}

/**
 * RentRevision entity - tracks changes to rent amounts over time
 * Immutable domain entity following Clean Architecture
 */
export class RentRevision {
  private constructor(private props: RentRevisionProps) {}

  static create(props: RentRevisionProps): RentRevision {
    return new RentRevision(props);
  }

  get id(): string {
    return this.props.id;
  }

  get leaseId(): string {
    return this.props.leaseId;
  }

  get effectiveDate(): Date {
    return this.props.effectiveDate;
  }

  get rentAmount(): Money {
    return this.props.rentAmount;
  }

  get chargesAmount(): Money {
    return this.props.chargesAmount;
  }

  get totalAmount(): Money {
    return this.props.rentAmount.add(this.props.chargesAmount);
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Checks if this revision is effective for a given month
   * @param monthDate First day of the month to check
   * @returns true if this revision applies to the given month
   */
  isEffectiveForMonth(monthDate: Date): boolean {
    // Set both dates to start of day for comparison
    const effectiveDay = new Date(
      this.props.effectiveDate.getFullYear(),
      this.props.effectiveDate.getMonth(),
      this.props.effectiveDate.getDate()
    );
    const monthDay = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      monthDate.getDate()
    );

    return effectiveDay <= monthDay;
  }
}
