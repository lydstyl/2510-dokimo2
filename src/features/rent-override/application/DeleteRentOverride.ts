import { ILeaseRentOverrideRepository } from './interfaces/ILeaseRentOverrideRepository';

/**
 * Use case: Delete a rent override
 *
 * This removes an override, causing the month to fall back to using
 * the applicable RentRevision or base lease amounts.
 */
export class DeleteRentOverride {
  constructor(private repository: ILeaseRentOverrideRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Rent override with ID ${id} not found`);
    }

    await this.repository.delete(id);
  }
}
