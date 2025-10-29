import { Money } from '../value-objects/Money';

export interface LeaseProps {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: Date;
  endDate?: Date;
  rentAmount: Money;
  chargesAmount: Money;
  paymentDueDay: number;
  irlQuarter?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Lease {
  private constructor(private props: LeaseProps) {
    this.validate();
  }

  static create(props: LeaseProps): Lease {
    return new Lease(props);
  }

  private validate(): void {
    if (this.props.paymentDueDay < 1 || this.props.paymentDueDay > 31) {
      throw new Error('Payment due day must be between 1 and 31');
    }
    if (this.props.endDate && this.props.endDate <= this.props.startDate) {
      throw new Error('End date must be after start date');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get propertyId(): string {
    return this.props.propertyId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
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

  get paymentDueDay(): number {
    return this.props.paymentDueDay;
  }

  get irlQuarter(): string | undefined {
    return this.props.irlQuarter;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isActive(date: Date = new Date()): boolean {
    if (date < this.props.startDate) {
      return false;
    }
    if (this.props.endDate && date > this.props.endDate) {
      return false;
    }
    return true;
  }

  getExpectedPaymentDate(forMonth: Date): Date {
    return new Date(
      Date.UTC(
        forMonth.getUTCFullYear(),
        forMonth.getUTCMonth(),
        this.props.paymentDueDay
      )
    );
  }
}
