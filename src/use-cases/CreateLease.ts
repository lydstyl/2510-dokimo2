import { Lease } from '../domain/entities/Lease';
import { Money } from '../domain/value-objects/Money';
import { ILeaseRepository } from './interfaces/ILeaseRepository';
import { randomUUID } from 'crypto';

export interface CreateLeaseInput {
  propertyId: string;
  tenantIds: string[];  // Support multiple tenants
  startDate: Date;
  endDate?: Date;
  rentAmount: number;
  chargesAmount: number;
  paymentDueDay: number;
  irlQuarter?: string;
  note?: string | null;
}

export class CreateLease {
  constructor(private leaseRepository: ILeaseRepository) {}

  async execute(input: CreateLeaseInput): Promise<Lease> {
    const lease = Lease.create({
      id: randomUUID(),
      propertyId: input.propertyId,
      tenantIds: input.tenantIds,
      startDate: input.startDate,
      endDate: input.endDate,
      rentAmount: Money.create(input.rentAmount),
      chargesAmount: Money.create(input.chargesAmount),
      paymentDueDay: input.paymentDueDay,
      irlQuarter: input.irlQuarter,
      note: input.note || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.leaseRepository.create(lease);
  }
}
