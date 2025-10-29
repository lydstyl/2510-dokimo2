import { IBoilerRepository } from './interfaces/IBoilerRepository';

export class DeleteBoiler {
  constructor(private boilerRepository: IBoilerRepository) {}

  async execute(id: string): Promise<void> {
    const existingBoiler = await this.boilerRepository.findById(id);

    if (!existingBoiler) {
      throw new Error('Boiler not found');
    }

    await this.boilerRepository.delete(id);
  }
}
