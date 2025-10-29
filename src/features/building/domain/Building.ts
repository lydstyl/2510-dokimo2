export interface BuildingProps {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Building {
  private constructor(private props: BuildingProps) {
    this.validate();
  }

  static create(props: BuildingProps): Building {
    return new Building(props);
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim() === '') {
      throw new Error('Building name cannot be empty');
    }
    if (!this.props.address || this.props.address.trim() === '') {
      throw new Error('Building address cannot be empty');
    }
    if (!this.props.postalCode || this.props.postalCode.trim() === '') {
      throw new Error('Building postal code cannot be empty');
    }
    if (!this.props.city || this.props.city.trim() === '') {
      throw new Error('Building city cannot be empty');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get address(): string {
    return this.props.address;
  }

  get postalCode(): string {
    return this.props.postalCode;
  }

  get city(): string {
    return this.props.city;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  getFullAddress(): string {
    return `${this.props.address}, ${this.props.postalCode} ${this.props.city}`;
  }
}
