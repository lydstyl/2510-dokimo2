import { ILeaseRepository } from './interfaces/ILeaseRepository';
import { IPaymentRepository } from './interfaces/IPaymentRepository';
import { IPropertyRepository } from './interfaces/IPropertyRepository';
import { ITenantRepository } from './interfaces/ITenantRepository';
import { ILandlordRepository } from './interfaces/ILandlordRepository';

export interface RentReceiptData {
  receiptNumber: string;
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
  payment: {
    amount: number;
    paymentDate: Date;
    periodStart: Date;
    periodEnd: Date;
    rentAmount: number;
    chargesAmount: number;
  };
}

export class GenerateRentReceipt {
  constructor(
    private leaseRepository: ILeaseRepository,
    private paymentRepository: IPaymentRepository,
    private propertyRepository: IPropertyRepository,
    private tenantRepository: ITenantRepository,
    private landlordRepository: ILandlordRepository
  ) {}

  async execute(paymentId: string): Promise<RentReceiptData> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const lease = await this.leaseRepository.findById(payment.leaseId);
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

    return {
      receiptNumber: `REC-${paymentId.slice(0, 8).toUpperCase()}`,
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
      payment: {
        amount: payment.amount.getValue(),
        paymentDate: payment.paymentDate,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        rentAmount: lease.rentAmount.getValue(),
        chargesAmount: lease.chargesAmount.getValue(),
      },
    };
  }
}
