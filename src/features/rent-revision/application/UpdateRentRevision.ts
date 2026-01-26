import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { RentRevision } from '../domain/RentRevision';
import { Money } from '@/domain/value-objects/Money';

/**
 * DTO for updating a rent revision
 */
export interface UpdateRentRevisionDto {
  id: string;
  effectiveDate?: Date;
  rentAmount?: number;
  chargesAmount?: number;
  reason?: string;
}

/**
 * Use case: Update an existing rent revision
 *
 * This use case allows updating revisions that are in EN_PREPARATION status.
 * It supports retroactive modifications - the effective date can be set to a past date,
 * which will trigger recalculation of the rent history from that date forward.
 */
export class UpdateRentRevision {
  constructor(private repository: IRentRevisionRepository) {}

  async execute(dto: UpdateRentRevisionDto): Promise<RentRevision> {
    // Find existing revision
    const existing = await this.repository.findById(dto.id);
    if (!existing) {
      throw new Error(`Rent revision with ID ${dto.id} not found`);
    }

    // Only allow updating EN_PREPARATION revisions
    if (!existing.isInPreparation()) {
      throw new Error('Cannot update a revision that is not in preparation');
    }

    // Build update props
    // Note: effectiveDate can be in the past for retroactive modifications
    const updateProps: Parameters<typeof existing.update>[0] = {};

    if (dto.effectiveDate !== undefined) {
      updateProps.effectiveDate = dto.effectiveDate;
    }

    if (dto.rentAmount !== undefined) {
      updateProps.rentAmount = Money.create(dto.rentAmount);
    }

    if (dto.chargesAmount !== undefined) {
      updateProps.chargesAmount = Money.create(dto.chargesAmount);
    }

    if (dto.reason !== undefined) {
      updateProps.reason = dto.reason;
    }

    // Update entity
    const updated = existing.update(updateProps);

    // Persist to repository
    return await this.repository.update(updated);
  }
}
