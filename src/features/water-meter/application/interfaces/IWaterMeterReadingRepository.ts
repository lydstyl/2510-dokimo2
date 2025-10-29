import { WaterMeterReading } from '../../domain/WaterMeterReading';

export interface IWaterMeterReadingRepository {
  findById(id: string): Promise<WaterMeterReading | null>;
  findByPropertyId(propertyId: string): Promise<WaterMeterReading[]>;
  findLatestByPropertyId(propertyId: string): Promise<WaterMeterReading | null>;
  create(reading: WaterMeterReading): Promise<WaterMeterReading>;
  update(reading: WaterMeterReading): Promise<WaterMeterReading>;
  delete(id: string): Promise<void>;
}
