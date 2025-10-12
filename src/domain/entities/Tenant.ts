import { Email } from '../value-objects/Email';

export interface TenantProps {
  id: string;
  firstName: string;
  lastName: string;
  email?: Email;
  phone?: string;
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
    if (!this.props.firstName || this.props.firstName.trim().length === 0) {
      throw new Error('Tenant first name is required');
    }
    if (!this.props.lastName || this.props.lastName.trim().length === 0) {
      throw new Error('Tenant last name is required');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get email(): Email | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
