import { IPropertyRepository } from './interfaces/IPropertyRepository';

export interface DeletePropertyInput {
  id: string;
}

export class DeleteProperty {
  constructor(private propertyRepository: IPropertyRepository) {}

  async execute(input: DeletePropertyInput): Promise<void> {
    // Check if property exists
    const existingProperty = await this.propertyRepository.findById(input.id);
    if (!existingProperty) {
      throw new Error('Property not found');
    }

    await this.propertyRepository.delete(input.id);
  }
}
