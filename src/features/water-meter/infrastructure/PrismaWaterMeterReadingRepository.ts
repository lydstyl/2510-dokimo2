import { PrismaClient } from '@prisma/client';
import { WaterMeterReading } from '../domain/WaterMeterReading';
import { IWaterMeterReadingRepository } from '../application/interfaces/IWaterMeterReadingRepository';

export class PrismaWaterMeterReadingRepository implements IWaterMeterReadingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<WaterMeterReading | null> {
    const reading = await this.prisma.waterMeterReading.findUnique({
      where: { id },
    });

    if (!reading) return null;

    return this.toDomain(reading);
  }

  async findByPropertyId(propertyId: string): Promise<WaterMeterReading[]> {
    const readings = await this.prisma.waterMeterReading.findMany({
      where: { propertyId },
      orderBy: { readingDate: 'desc' },
    });

    return readings.map((r) => this.toDomain(r));
  }

  async findLatestByPropertyId(propertyId: string): Promise<WaterMeterReading | null> {
    const reading = await this.prisma.waterMeterReading.findFirst({
      where: { propertyId },
      orderBy: { readingDate: 'desc' },
    });

    if (!reading) return null;

    return this.toDomain(reading);
  }

  async create(reading: WaterMeterReading): Promise<WaterMeterReading> {
    const created = await this.prisma.waterMeterReading.create({
      data: {
        id: reading.id,
        propertyId: reading.propertyId,
        readingDate: reading.readingDate,
        meterReading: reading.meterReading,
        documentPath: reading.documentPath,
        createdAt: reading.createdAt,
        updatedAt: reading.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(reading: WaterMeterReading): Promise<WaterMeterReading> {
    const updated = await this.prisma.waterMeterReading.update({
      where: { id: reading.id },
      data: {
        readingDate: reading.readingDate,
        meterReading: reading.meterReading,
        documentPath: reading.documentPath,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.waterMeterReading.delete({
      where: { id },
    });
  }

  private toDomain(reading: {
    id: string;
    propertyId: string;
    readingDate: Date;
    meterReading: number;
    documentPath: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): WaterMeterReading {
    return WaterMeterReading.create({
      id: reading.id,
      propertyId: reading.propertyId,
      readingDate: reading.readingDate,
      meterReading: reading.meterReading,
      documentPath: reading.documentPath ?? undefined,
      createdAt: reading.createdAt,
      updatedAt: reading.updatedAt,
    });
  }
}
