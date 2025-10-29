export interface BoilerProps {
  id: string;
  propertyId: string;
  name?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Boiler {
  private constructor(private readonly props: BoilerProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('Boiler id is required');
    }
    if (!this.props.propertyId || this.props.propertyId.trim() === '') {
      throw new Error('Property id is required');
    }
    if (!this.props.createdAt) {
      throw new Error('Created at is required');
    }
    if (!this.props.updatedAt) {
      throw new Error('Updated at is required');
    }
  }

  static create(props: BoilerProps): Boiler {
    return new Boiler(props);
  }

  get id(): string {
    return this.props.id;
  }

  get propertyId(): string {
    return this.props.propertyId;
  }

  get name(): string | undefined {
    return this.props.name;
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
}
