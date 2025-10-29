import { WaterMeterReading } from '../domain/WaterMeterReading';
import { IWaterMeterReadingRepository } from './interfaces/IWaterMeterReadingRepository';
import { randomUUID } from 'crypto';

interface CreateWaterMeterReadingInput {
  propertyId: string;
  readingDate: Date;
  meterReading: number;
  documentPath?: string;
}

export class CreateWaterMeterReading {
  constructor(private repository: IWaterMeterReadingRepository) {}

  async execute(input: CreateWaterMeterReadingInput): Promise<WaterMeterReading> {
    const now = new Date();

    const reading = WaterMeterReading.create({
      id: randomUUID(),
      propertyId: input.propertyId,
      readingDate: input.readingDate,
      meterReading: input.meterReading,
      documentPath: input.documentPath,
      createdAt: now,
      updatedAt: now,
    });

    return await this.repository.create(reading);
  }
}
