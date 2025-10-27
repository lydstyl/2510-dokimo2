import { RentRevision } from '@/domain/entities/RentRevision';
import { Money } from '@/domain/value-objects/Money';
import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { ILeaseRepository } from './interfaces/ILeaseRepository';

export interface CreateRentRevisionInput {
  leaseId: string;
  effectiveDate: Date;
  rentAmount: number;
  chargesAmount: number;
  reason?: string;
}

/**
 * Use case: Create a new rent revision for a lease
 * This tracks historical changes to rent amounts
 */
export class CreateRentRevision {
  constructor(
    private rentRevisionRepository: IRentRevisionRepository,
    private leaseRepository: ILeaseRepository
  ) {}

  async execute(input: CreateRentRevisionInput): Promise<RentRevision> {
    // Verify lease exists
    const lease = await this.leaseRepository.findById(input.leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    // Validate amounts
    if (input.rentAmount < 0) {
      throw new Error('Rent amount cannot be negative');
    }
    if (input.chargesAmount < 0) {
      throw new Error('Charges amount cannot be negative');
    }

    // Create revision entity
    const revision = RentRevision.create({
      id: this.generateId(),
      leaseId: input.leaseId,
      effectiveDate: input.effectiveDate,
      rentAmount: Money.create(input.rentAmount),
      chargesAmount: Money.create(input.chargesAmount),
      reason: input.reason,
      createdAt: new Date(),
    });

    // Save to repository
    return await this.rentRevisionRepository.create(revision);
  }

  private generateId(): string {
    // Simple ID generation (in production, use a proper library like cuid)
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
