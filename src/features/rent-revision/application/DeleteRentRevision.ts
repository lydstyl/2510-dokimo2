import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';

/**
 * Use case: Delete a rent revision
 */
export class DeleteRentRevision {
  constructor(private repository: IRentRevisionRepository) {}

  async execute(id: string): Promise<void> {
    // Find existing revision
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Rent revision with ID ${id} not found`);
    }

    // Only allow deleting EN_PREPARATION revisions
    if (!existing.isInPreparation()) {
      throw new Error('Cannot delete a revision that is not in preparation');
    }

    // Delete from repository
    await this.repository.delete(id);
  }
}
