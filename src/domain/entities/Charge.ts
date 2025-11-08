import { Money } from '../value-objects/Money';

export interface ChargeProps {
  id: string;
  leaseId: string;
  amount: Money;
  chargeDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Charge {
  private constructor(private props: ChargeProps) {}

  static create(props: ChargeProps): Charge {
    // Validate amount is a Money instance
    if (!(props.amount instanceof Money)) {
      throw new Error('Amount must be a Money instance');
    }

    // Validate chargeDate is a valid date
    if (isNaN(props.chargeDate.getTime())) {
      throw new Error('Invalid charge date');
    }

    return new Charge(props);
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

  get chargeDate(): Date {
    return this.props.chargeDate;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
