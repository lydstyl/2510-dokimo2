import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { RentRevision } from '../domain/RentRevision';

/**
 * Use case: Mark a rent revision letter as sent
 */
export class MarkRevisionAsLetterSent {
  constructor(private repository: IRentRevisionRepository) {}

  async execute(id: string): Promise<RentRevision> {
    // Find existing revision
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Rent revision with ID ${id} not found`);
    }

    // Mark as letter sent
    const updated = existing.markAsLetterSent();

    // Persist to repository
    return await this.repository.update(updated);
  }
}
