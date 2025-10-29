import { Boiler } from '../domain/Boiler';
import { IBoilerRepository } from './interfaces/IBoilerRepository';
import { randomUUID } from 'crypto';

interface CreateBoilerInput {
  propertyId: string;
  name?: string;
  notes?: string;
}

export class CreateBoiler {
  constructor(private boilerRepository: IBoilerRepository) {}

  async execute(input: CreateBoilerInput): Promise<Boiler> {
    const now = new Date();

    const boiler = Boiler.create({
      id: randomUUID(),
      propertyId: input.propertyId,
      name: input.name,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    });

    return await this.boilerRepository.create(boiler);
  }
}
