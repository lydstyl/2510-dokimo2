import { IWaterMeterReadingRepository } from './interfaces/IWaterMeterReadingRepository';

export class DeleteWaterMeterReading {
  constructor(private repository: IWaterMeterReadingRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error('Water meter reading not found');
    }

    // Note: We do NOT delete the document file - we keep it for records
    await this.repository.delete(id);
  }
}
