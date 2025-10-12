import { Money } from '../value-objects/Money';

export interface PaymentProps {
  id: string;
  leaseId: string;
  amount: Money;
  paymentDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  private constructor(private props: PaymentProps) {}

  static create(props: PaymentProps): Payment {
    return new Payment(props);
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
}
