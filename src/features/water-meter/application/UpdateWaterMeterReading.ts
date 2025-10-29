import { WaterMeterReading } from '../domain/WaterMeterReading';
import { IWaterMeterReadingRepository } from './interfaces/IWaterMeterReadingRepository';

interface UpdateWaterMeterReadingInput {
  id: string;
  readingDate?: Date;
  meterReading?: number;
  documentPath?: string;
}

export class UpdateWaterMeterReading {
  constructor(private repository: IWaterMeterReadingRepository) {}

  async execute(input: UpdateWaterMeterReadingInput): Promise<WaterMeterReading> {
    const existing = await this.repository.findById(input.id);

    if (!existing) {
      throw new Error('Water meter reading not found');
    }

    const updated = WaterMeterReading.create({
      id: existing.id,
      propertyId: existing.propertyId,
      readingDate: input.readingDate !== undefined ? input.readingDate : existing.readingDate,
      meterReading: input.meterReading !== undefined ? input.meterReading : existing.meterReading,
      documentPath: input.documentPath !== undefined ? input.documentPath : existing.documentPath,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    return await this.repository.update(updated);
  }
}
