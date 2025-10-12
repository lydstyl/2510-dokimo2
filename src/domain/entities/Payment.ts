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
    return this.props.paymentDate > expectedDate;
  }

  coversMonth(month: Date): boolean {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return (
      this.props.periodStart <= monthStart &&
      this.props.periodEnd >= monthEnd
    );
  }
}
