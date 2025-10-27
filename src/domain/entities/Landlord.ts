import { Email } from '../value-objects/Email';

export enum LandlordType {
  NATURAL_PERSON = 'NATURAL_PERSON',
  LEGAL_ENTITY = 'LEGAL_ENTITY',
}

export interface LandlordProps {
  id: string;
  name: string;
  type: LandlordType;
  address: string;
  email?: Email;
  phone?: string;
  siret?: string;
  managerName?: string;
  managerEmail?: Email;
  managerPhone?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Landlord {
  private constructor(private props: LandlordProps) {
    this.validate();
  }

  static create(props: LandlordProps): Landlord {
    return new Landlord(props);
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Landlord name is required');
    }
    if (!this.props.address || this.props.address.trim().length === 0) {
      throw new Error('Landlord address is required');
    }
    if (this.props.type === LandlordType.LEGAL_ENTITY && !this.props.siret) {
      throw new Error('SIRET is required for legal entities');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): LandlordType {
    return this.props.type;
  }

  get address(): string {
    return this.props.address;
  }

  get email(): Email | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get siret(): string | undefined {
    return this.props.siret;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get managerName(): string | undefined {
    return this.props.managerName;
  }

  get managerEmail(): Email | undefined {
    return this.props.managerEmail;
  }

  get managerPhone(): string | undefined {
    return this.props.managerPhone;
  }

  isLegalEntity(): boolean {
    return this.props.type === LandlordType.LEGAL_ENTITY;
  }

  hasManager(): boolean {
    return this.isLegalEntity() && !!this.props.managerName;
  }
}
