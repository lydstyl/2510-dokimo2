import { Email } from '../value-objects/Email';

export type TenantType = 'NATURAL_PERSON' | 'LEGAL_ENTITY';

export interface TenantProps {
  id: string;
  type: TenantType;
  civility?: string;
  firstName: string;  // for natural persons, or company name for legal entities
  lastName: string;   // for natural persons, empty for legal entities
  email?: Email;
  phone?: string;
  siret?: string;      // for legal entities
  managerName?: string;  // for legal entities
  managerEmail?: Email;  // for legal entities
  managerPhone?: string; // for legal entities
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant {
  private constructor(private props: TenantProps) {
    this.validate();
  }

  static create(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  private validate(): void {
    if (!this.props.type) {
      throw new Error('Tenant type is required');
    }

    if (this.props.type === 'NATURAL_PERSON') {
      if (!this.props.firstName || this.props.firstName.trim().length === 0) {
        throw new Error('Tenant first name is required');
      }
      if (!this.props.lastName || this.props.lastName.trim().length === 0) {
        throw new Error('Tenant last name is required');
      }
    }

    if (this.props.type === 'LEGAL_ENTITY') {
      if (!this.props.firstName || this.props.firstName.trim().length === 0) {
        throw new Error('Company name is required');
      }
    }
  }

  get id(): string {
    return this.props.id;
  }

  get type(): TenantType {
    return this.props.type;
  }

  get civility(): string | undefined {
    return this.props.civility;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get companyName(): string | undefined {
    return this.props.type === 'LEGAL_ENTITY' ? this.props.firstName : undefined;
  }

  get fullName(): string {
    if (this.props.type === 'LEGAL_ENTITY') {
      return this.props.firstName; // company name
    }
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get fullNameWithCivility(): string {
    if (this.props.type === 'LEGAL_ENTITY') {
      return this.props.firstName; // company name
    }
    if (this.props.civility) {
      return `${this.props.civility} ${this.props.firstName} ${this.props.lastName}`;
    }
    return this.fullName;
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

  get managerName(): string | undefined {
    return this.props.managerName;
  }

  get managerEmail(): Email | undefined {
    return this.props.managerEmail;
  }

  get managerPhone(): string | undefined {
    return this.props.managerPhone;
  }

  get isLegalEntity(): boolean {
    return this.props.type === 'LEGAL_ENTITY';
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
