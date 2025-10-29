import { DocumentCategory } from './FinancialDocument';

export interface PropertyChargeShareProps {
  id: string;
  propertyId: string;
  category: DocumentCategory;
  percentage: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export class PropertyChargeShare {
  private constructor(private props: PropertyChargeShareProps) {
    this.validate();
  }

  static create(props: PropertyChargeShareProps): PropertyChargeShare {
    return new PropertyChargeShare(props);
  }

  private validate(): void {
    if (this.props.percentage < 0 || this.props.percentage > 100) {
      throw new Error('Charge share percentage must be between 0 and 100');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get propertyId(): string {
    return this.props.propertyId;
  }

  get category(): DocumentCategory {
    return this.props.category;
  }

  get percentage(): number {
    return this.props.percentage;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Convert percentage to decimal for calculations (25% -> 0.25)
  getDecimalPercentage(): number {
    return this.props.percentage / 100;
  }
}
