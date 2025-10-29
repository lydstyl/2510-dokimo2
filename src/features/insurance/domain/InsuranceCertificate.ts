export interface InsuranceCertificateProps {
  id: string;
  propertyId: string;
  startDate: Date;
  endDate?: Date;
  documentPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InsuranceCertificate {
  private constructor(private readonly props: InsuranceCertificateProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('Insurance certificate id is required');
    }
    if (!this.props.propertyId || this.props.propertyId.trim() === '') {
      throw new Error('Property id is required');
    }
    if (!this.props.startDate) {
      throw new Error('Start date is required');
    }
    if (this.props.endDate && this.props.endDate < this.props.startDate) {
      throw new Error('End date cannot be before start date');
    }
  }

  static create(props: InsuranceCertificateProps): InsuranceCertificate {
    return new InsuranceCertificate(props);
  }

  get id(): string {
    return this.props.id;
  }

  get propertyId(): string {
    return this.props.propertyId;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
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
   * Check if the insurance certificate has expired
   */
  isExpired(): boolean {
    if (!this.props.endDate) return false;
    return this.props.endDate < new Date();
  }

  /**
   * Check if the insurance certificate is older than one year
   */
  isOlderThanOneYear(): boolean {
    return this.monthsSinceStart() >= 12;
  }

  /**
   * Calculate how many months have passed since start date
   */
  monthsSinceStart(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.props.startDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays / 30); // Approximate months
  }
}
