import { ILeaseRentOverrideRepository } from './interfaces/ILeaseRentOverrideRepository';
import { LeaseRentOverride } from '../domain/LeaseRentOverride';
import { Money } from '@/domain/value-objects/Money';
import { randomUUID } from 'crypto';

/**
 * DTO for creating or updating a rent override
 */
export interface CreateOrUpdateRentOverrideDto {
  leaseId: string;
  month: string; // YYYY-MM format
  rentAmount: number;
  chargesAmount: number;
  reason?: string;
}

/**
 * Use case: Create or update a rent override for a specific month
 *
 * This allows modifying the rent amount shown in payment history for a specific month
 * without creating a formal RentRevision. If an override already exists for the
 * lease/month combination, it updates it; otherwise creates a new one.
 */
export class CreateOrUpdateRentOverride {
  constructor(private repository: ILeaseRentOverrideRepository) {}

  async execute(dto: CreateOrUpdateRentOverrideDto): Promise<LeaseRentOverride> {
    // Create Money value objects (validates non-negative amounts)
    const rentAmount = Money.create(dto.rentAmount);
    const chargesAmount = Money.create(dto.chargesAmount);

    // Check if override already exists for this lease/month
    const existing = await this.repository.findByLeaseIdAndMonth(dto.leaseId, dto.month);

    if (existing) {
      // Update existing override
      const updated = existing.update({
        rentAmount,
        chargesAmount,
        reason: dto.reason,
      });

      return await this.repository.update(updated);
    } else {
      // Create new override
      const override = LeaseRentOverride.create({
        id: randomUUID(),
        leaseId: dto.leaseId,
        month: dto.month,
        rentAmount,
        chargesAmount,
        reason: dto.reason,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await this.repository.create(override);
    }
  }
}
