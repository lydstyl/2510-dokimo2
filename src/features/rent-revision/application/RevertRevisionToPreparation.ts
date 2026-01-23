import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { RentRevision } from '../domain/RentRevision';

/**
 * Use case: Revert a sent rent revision back to preparation status
 * Useful for reusing a sent revision for next year or correcting mistakes
 */
export class RevertRevisionToPreparation {
  constructor(private repository: IRentRevisionRepository) {}

  async execute(id: string): Promise<RentRevision> {
    // Find existing revision
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Rent revision with ID ${id} not found`);
    }

    // Mark back to preparation
    const updated = existing.markBackToPreparation();

    // Persist to repository
    return await this.repository.update(updated);
  }
}
