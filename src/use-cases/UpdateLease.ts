import { Lease } from '../domain/entities/Lease';
import { Money } from '../domain/value-objects/Money';
import { ILeaseRepository } from './interfaces/ILeaseRepository';

export interface UpdateLeaseInput {
  id: string;
  propertyId: string;
  tenantIds: string[];  // Support multiple tenants
  startDate: Date;
  endDate?: Date;
  rentAmount: number;
  chargesAmount: number;
  paymentDueDay: number;
  irlQuarter?: string;
}

export class UpdateLease {
  constructor(private leaseRepository: ILeaseRepository) {}

  async execute(input: UpdateLeaseInput): Promise<Lease> {
    const existingLease = await this.leaseRepository.findById(input.id);

    if (!existingLease) {
      throw new Error('Lease not found');
    }

    const updatedLease = Lease.create({
      id: input.id,
      propertyId: input.propertyId,
      tenantIds: input.tenantIds,
      startDate: input.startDate,
      endDate: input.endDate,
      rentAmount: Money.create(input.rentAmount),
      chargesAmount: Money.create(input.chargesAmount),
      paymentDueDay: input.paymentDueDay,
      irlQuarter: input.irlQuarter,
      createdAt: existingLease.createdAt,
      updatedAt: new Date(),
    });

    return this.leaseRepository.update(updatedLease);
  }
}
