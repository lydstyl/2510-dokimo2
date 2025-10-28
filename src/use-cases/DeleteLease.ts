import { ILeaseRepository } from './interfaces/ILeaseRepository';

export class DeleteLease {
  constructor(private leaseRepository: ILeaseRepository) {}

  async execute(id: string): Promise<void> {
    const existingLease = await this.leaseRepository.findById(id);

    if (!existingLease) {
      throw new Error('Lease not found');
    }

    await this.leaseRepository.delete(id);
  }
}
