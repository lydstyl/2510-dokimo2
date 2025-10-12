import { ILeaseRepository } from './interfaces/ILeaseRepository';
import { IPropertyRepository } from './interfaces/IPropertyRepository';
import { ITenantRepository } from './interfaces/ITenantRepository';
import { ILandlordRepository } from './interfaces/ILandlordRepository';

export interface RentDueNoticeData {
  noticeNumber: string;
  issueDate: Date;
  landlord: {
    name: string;
    address: string;
    email?: string;
    phone?: string;
  };
  tenant: {
    name: string;
    email?: string;
    phone?: string;
  };
  property: {
    address: string;
    city: string;
    postalCode: string;
  };
  lease: {
    rentAmount: number;
    chargesAmount: number;
    totalAmount: number;
    paymentDueDay: number;
  };
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
}

export class GenerateRentDueNotice {
  constructor(
    private leaseRepository: ILeaseRepository,
    private propertyRepository: IPropertyRepository,
    private tenantRepository: ITenantRepository,
    private landlordRepository: ILandlordRepository
  ) {}

  async execute(leaseId: string, forMonth: Date): Promise<RentDueNoticeData> {
    const lease = await this.leaseRepository.findById(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    const property = await this.propertyRepository.findById(lease.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    const tenant = await this.tenantRepository.findById(lease.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const landlord = await this.landlordRepository.findById(property.landlordId);
    if (!landlord) {
      throw new Error('Landlord not found');
    }

    const dueDate = lease.getExpectedPaymentDate(forMonth);
    const periodStart = new Date(forMonth.getFullYear(), forMonth.getMonth(), 1);
    const periodEnd = new Date(forMonth.getFullYear(), forMonth.getMonth() + 1, 0);

    return {
      noticeNumber: `NOTICE-${leaseId.slice(0, 8).toUpperCase()}-${forMonth.getFullYear()}${String(forMonth.getMonth() + 1).padStart(2, '0')}`,
      issueDate: new Date(),
      landlord: {
        name: landlord.name,
        address: landlord.address,
        email: landlord.email?.getValue(),
        phone: landlord.phone,
      },
      tenant: {
        name: tenant.fullName,
        email: tenant.email?.getValue(),
        phone: tenant.phone,
      },
      property: {
        address: property.address,
        city: property.city,
        postalCode: property.postalCode,
      },
      lease: {
        rentAmount: lease.rentAmount.getValue(),
        chargesAmount: lease.chargesAmount.getValue(),
        totalAmount: lease.totalAmount.getValue(),
        paymentDueDay: lease.paymentDueDay,
      },
      dueDate,
      periodStart,
      periodEnd,
    };
  }
}
