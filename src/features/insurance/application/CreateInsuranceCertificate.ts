import { InsuranceCertificate } from '../domain/InsuranceCertificate';
import { IInsuranceCertificateRepository } from './interfaces/IInsuranceCertificateRepository';
import { randomUUID } from 'crypto';

interface CreateInsuranceCertificateInput {
  propertyId: string;
  startDate: Date;
  endDate?: Date;
  documentPath?: string;
}

export class CreateInsuranceCertificate {
  constructor(private repository: IInsuranceCertificateRepository) {}

  async execute(input: CreateInsuranceCertificateInput): Promise<InsuranceCertificate> {
    const now = new Date();

    const certificate = InsuranceCertificate.create({
      id: randomUUID(),
      propertyId: input.propertyId,
      startDate: input.startDate,
      endDate: input.endDate,
      documentPath: input.documentPath,
      createdAt: now,
      updatedAt: now,
    });

    return await this.repository.create(certificate);
  }
}
