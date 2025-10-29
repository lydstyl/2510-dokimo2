import { PrismaClient } from '@prisma/client';
import { InsuranceCertificate } from '../domain/InsuranceCertificate';
import { IInsuranceCertificateRepository } from '../application/interfaces/IInsuranceCertificateRepository';

export class PrismaInsuranceCertificateRepository implements IInsuranceCertificateRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<InsuranceCertificate | null> {
    const cert = await this.prisma.insuranceCertificate.findUnique({
      where: { id },
    });

    if (!cert) return null;

    return this.toDomain(cert);
  }

  async findByPropertyId(propertyId: string): Promise<InsuranceCertificate[]> {
    const certs = await this.prisma.insuranceCertificate.findMany({
      where: { propertyId },
      orderBy: { startDate: 'desc' },
    });

    return certs.map((c) => this.toDomain(c));
  }

  async findLatestByPropertyId(propertyId: string): Promise<InsuranceCertificate | null> {
    const cert = await this.prisma.insuranceCertificate.findFirst({
      where: { propertyId },
      orderBy: { startDate: 'desc' },
    });

    if (!cert) return null;

    return this.toDomain(cert);
  }

  async findAll(): Promise<InsuranceCertificate[]> {
    const certs = await this.prisma.insuranceCertificate.findMany({
      orderBy: { startDate: 'desc' },
    });

    return certs.map((c) => this.toDomain(c));
  }

  async create(certificate: InsuranceCertificate): Promise<InsuranceCertificate> {
    const created = await this.prisma.insuranceCertificate.create({
      data: {
        id: certificate.id,
        propertyId: certificate.propertyId,
        startDate: certificate.startDate,
        endDate: certificate.endDate,
        documentPath: certificate.documentPath,
        createdAt: certificate.createdAt,
        updatedAt: certificate.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(certificate: InsuranceCertificate): Promise<InsuranceCertificate> {
    const updated = await this.prisma.insuranceCertificate.update({
      where: { id: certificate.id },
      data: {
        startDate: certificate.startDate,
        endDate: certificate.endDate,
        documentPath: certificate.documentPath,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.insuranceCertificate.delete({
      where: { id },
    });
  }

  private toDomain(cert: {
    id: string;
    propertyId: string;
    startDate: Date;
    endDate: Date | null;
    documentPath: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): InsuranceCertificate {
    return InsuranceCertificate.create({
      id: cert.id,
      propertyId: cert.propertyId,
      startDate: cert.startDate,
      endDate: cert.endDate ?? undefined,
      documentPath: cert.documentPath ?? undefined,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
    });
  }
}
