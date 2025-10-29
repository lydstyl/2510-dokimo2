export enum DocumentCategory {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  CLEANING = 'CLEANING',
  GARBAGE_TAX = 'GARBAGE_TAX',
  HEATING = 'HEATING',
  ELEVATOR = 'ELEVATOR',
  COMMON_AREA_MAINTENANCE = 'COMMON_AREA_MAINTENANCE',
  PROPERTY_TAX = 'PROPERTY_TAX',
  RENOVATION_WORK = 'RENOVATION_WORK',
  REPAIR_WORK = 'REPAIR_WORK',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER',
}

export interface FinancialDocumentProps {
  id: string;
  buildingId: string;
  category: DocumentCategory;
  date: Date;
  amount: number;
  description: string;
  documentPath?: string;
  includedInCharges: boolean;
  waterConsumption?: number; // only for WATER category
  createdAt: Date;
  updatedAt: Date;
}

export class FinancialDocument {
  private constructor(private props: FinancialDocumentProps) {
    this.validate();
  }

  static create(props: FinancialDocumentProps): FinancialDocument {
    return new FinancialDocument(props);
  }

  private validate(): void {
    if (this.props.amount < 0) {
      throw new Error('Financial document amount cannot be negative');
    }
    if (!this.props.description || this.props.description.trim() === '') {
      throw new Error('Financial document description cannot be empty');
    }
    if (this.props.date > new Date()) {
      throw new Error('Financial document date cannot be in the future');
    }
    if (this.props.waterConsumption !== undefined && this.props.waterConsumption < 0) {
      throw new Error('Water consumption cannot be negative');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get buildingId(): string {
    return this.props.buildingId;
  }

  get category(): DocumentCategory {
    return this.props.category;
  }

  get date(): Date {
    return this.props.date;
  }

  get amount(): number {
    return this.props.amount;
  }

  get description(): string {
    return this.props.description;
  }

  get documentPath(): string | undefined {
    return this.props.documentPath;
  }

  get isIncludedInCharges(): boolean {
    return this.props.includedInCharges;
  }

  get waterConsumption(): number | undefined {
    return this.props.waterConsumption;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isWaterBill(): boolean {
    return this.props.category === DocumentCategory.WATER;
  }

  isWithinLast12Months(referenceDate: Date = new Date()): boolean {
    const twelveMonthsAgo = new Date(referenceDate);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    return this.props.date >= twelveMonthsAgo;
  }
}
