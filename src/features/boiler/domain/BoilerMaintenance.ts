export interface BoilerMaintenanceProps {
  id: string;
  boilerId: string;
  maintenanceDate: Date;
  documentPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BoilerMaintenance {
  private constructor(private readonly props: BoilerMaintenanceProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('Maintenance id is required');
    }
    if (!this.props.boilerId || this.props.boilerId.trim() === '') {
      throw new Error('Boiler id is required');
    }
    if (!this.props.maintenanceDate) {
      throw new Error('Maintenance date is required');
    }
    if (this.props.maintenanceDate > new Date()) {
      throw new Error('Maintenance date cannot be in the future');
    }
  }

  static create(props: BoilerMaintenanceProps): BoilerMaintenance {
    return new BoilerMaintenance(props);
  }

  get id(): string {
    return this.props.id;
  }

  get boilerId(): string {
    return this.props.boilerId;
  }

  get maintenanceDate(): Date {
    return this.props.maintenanceDate;
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
   * Check if the maintenance is overdue (more than 11 months old)
   */
  isOverdue(): boolean {
    return this.monthsSinceLastMaintenance() >= 11;
  }

  /**
   * Calculate how many months have passed since the last maintenance
   */
  monthsSinceLastMaintenance(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.props.maintenanceDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays / 30); // Approximate months
  }

  /**
   * Get the ideal next maintenance date (one year after last maintenance)
   */
  nextMaintenanceDate(): Date {
    const nextDate = new Date(this.props.maintenanceDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
  }
}
