import { ILandlordRepository } from './interfaces/ILandlordRepository';

export interface DeleteLandlordInput {
  id: string;
  userId: string;
}

export class DeleteLandlord {
  constructor(private landlordRepository: ILandlordRepository) {}

  async execute(input: DeleteLandlordInput): Promise<void> {
    // Check if landlord exists
    const existingLandlord = await this.landlordRepository.findById(input.id);
    if (!existingLandlord) {
      throw new Error('Landlord not found');
    }

    // Verify ownership
    if (existingLandlord.userId !== input.userId) {
      throw new Error('Unauthorized to delete this landlord');
    }

    await this.landlordRepository.delete(input.id);
  }
}
