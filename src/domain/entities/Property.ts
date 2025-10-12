export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  GARAGE = 'GARAGE',
  PARKING = 'PARKING',
  COMMERCIAL = 'COMMERCIAL',
  OTHER = 'OTHER',
}

export interface PropertyProps {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  postalCode: string;
  city: string;
  landlordId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Property {
  private constructor(private props: PropertyProps) {
    this.validate();
  }

  static create(props: PropertyProps): Property {
    return new Property(props);
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Property name is required');
    }
    if (!this.props.address || this.props.address.trim().length === 0) {
      throw new Error('Property address is required');
    }
    if (!this.props.postalCode || this.props.postalCode.trim().length === 0) {
      throw new Error('Property postal code is required');
    }
    if (!this.props.city || this.props.city.trim().length === 0) {
      throw new Error('Property city is required');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): PropertyType {
    return this.props.type;
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

  get landlordId(): string {
    return this.props.landlordId;
  }

  get fullAddress(): string {
    return `${this.props.address}, ${this.props.postalCode} ${this.props.city}`;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
