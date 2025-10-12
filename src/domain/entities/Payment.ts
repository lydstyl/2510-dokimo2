import { Money } from '../value-objects/Money';

export enum PaymentType {
  RENT = 'RENT',
  CHARGES = 'CHARGES',
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

export interface PaymentProps {
  id: string;
  leaseId: string;
  amount: Money;
  paymentDate: Date;
  periodStart: Date;
  periodEnd: Date;
  type: PaymentType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  private constructor(private props: PaymentProps) {
    this.validate();
  }

  static create(props: PaymentProps): Payment {
    return new Payment(props);
  }

  private validate(): void {
    if (this.props.periodEnd <= this.props.periodStart) {
      throw new Error('Period end must be after period start');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get leaseId(): string {
    return this.props.leaseId;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get paymentDate(): Date {
    return this.props.paymentDate;
  }

  get periodStart(): Date {
    return this.props.periodStart;
  }

  get periodEnd(): Date {
    return this.props.periodEnd;
  }

  get type(): PaymentType {
    return this.props.type;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isLatePayment(expectedDate: Date): boolean {
    // Compare dates ignoring time component
    const paymentDay = new Date(
      this.props.paymentDate.getUTCFullYear(),
      this.props.paymentDate.getUTCMonth(),
      this.props.paymentDate.getUTCDate()
    );
    const expectedDay = new Date(
      expectedDate.getUTCFullYear(),
      expectedDate.getUTCMonth(),
      expectedDate.getUTCDate()
    );
    return paymentDay > expectedDay;
  }

  coversMonth(month: Date): boolean {
    // Get year, month, day components for comparison (ignoring time)
    const getDateOnly = (date: Date) => {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      return new Date(Date.UTC(year, month, day));
    };

    const year = month.getUTCFullYear();
    const monthIndex = month.getUTCMonth();

    // First day of the month
    const monthStart = new Date(Date.UTC(year, monthIndex, 1));
    // Last day of the month
    const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));

    const periodStart = getDateOnly(this.props.periodStart);
    const periodEnd = getDateOnly(this.props.periodEnd);

    return (
      periodStart.getTime() <= monthStart.getTime() &&
      periodEnd.getTime() >= monthEnd.getTime()
    );
  }
}
