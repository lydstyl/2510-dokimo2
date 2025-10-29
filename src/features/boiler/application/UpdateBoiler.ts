import { Boiler } from '../domain/Boiler';
import { IBoilerRepository } from './interfaces/IBoilerRepository';

interface UpdateBoilerInput {
  id: string;
  name?: string;
  notes?: string;
}

export class UpdateBoiler {
  constructor(private boilerRepository: IBoilerRepository) {}

  async execute(input: UpdateBoilerInput): Promise<Boiler> {
    const existingBoiler = await this.boilerRepository.findById(input.id);

    if (!existingBoiler) {
      throw new Error('Boiler not found');
    }

    const updatedBoiler = Boiler.create({
      id: existingBoiler.id,
      propertyId: existingBoiler.propertyId,
      name: input.name !== undefined ? input.name : existingBoiler.name,
      notes: input.notes !== undefined ? input.notes : existingBoiler.notes,
      createdAt: existingBoiler.createdAt,
      updatedAt: new Date(),
    });

    return await this.boilerRepository.update(updatedBoiler);
  }
}
