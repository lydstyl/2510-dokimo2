export interface WaterMeterReadingProps {
  id: string;
  propertyId: string;
  readingDate: Date;
  meterReading: number; // in cubic meters (m³)
  documentPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WaterMeterReading {
  private constructor(private readonly props: WaterMeterReadingProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('Water meter reading id is required');
    }
    if (!this.props.propertyId || this.props.propertyId.trim() === '') {
      throw new Error('Property id is required');
    }
    if (!this.props.readingDate) {
      throw new Error('Reading date is required');
    }
    if (this.props.readingDate > new Date()) {
      throw new Error('Reading date cannot be in the future');
    }
    if (this.props.meterReading < 0) {
      throw new Error('Meter reading cannot be negative');
    }
  }

  static create(props: WaterMeterReadingProps): WaterMeterReading {
    return new WaterMeterReading(props);
  }

  get id(): string {
    return this.props.id;
  }

  get propertyId(): string {
    return this.props.propertyId;
  }

  get readingDate(): Date {
    return this.props.readingDate;
  }

  get meterReading(): number {
    return this.props.meterReading;
  }

  get documentPath(): string | undefined {
    return this.props.documentPath;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if the reading is older than one year
   */
  isOlderThanOneYear(): boolean {
    return this.monthsSinceReading() >= 12;
  }

  /**
   * Calculate how many months have passed since the reading
   */
  monthsSinceReading(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.props.readingDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays / 30); // Approximate months
  }
}
