import { Lease } from '../domain/entities/Lease';
import { Money } from '../domain/value-objects/Money';
import { ILeaseRepository } from './interfaces/ILeaseRepository';
import { randomUUID } from 'crypto';

export interface CreateLeaseInput {
  propertyId: string;
  tenantId: string;
  startDate: Date;
  endDate?: Date;
  rentAmount: number;
  chargesAmount: number;
  paymentDueDay: number;
}

export class CreateLease {
  constructor(private leaseRepository: ILeaseRepository) {}

  async execute(input: CreateLeaseInput): Promise<Lease> {
    const lease = Lease.create({
      id: randomUUID(),
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      startDate: input.startDate,
      endDate: input.endDate,
      rentAmount: Money.create(input.rentAmount),
      chargesAmount: Money.create(input.chargesAmount),
      paymentDueDay: input.paymentDueDay,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.leaseRepository.create(lease);
  }
}
