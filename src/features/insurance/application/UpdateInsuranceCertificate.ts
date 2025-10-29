import { InsuranceCertificate } from '../domain/InsuranceCertificate';
import { IInsuranceCertificateRepository } from './interfaces/IInsuranceCertificateRepository';

interface UpdateInsuranceCertificateInput {
  id: string;
  startDate?: Date;
  endDate?: Date;
  documentPath?: string;
}

export class UpdateInsuranceCertificate {
  constructor(private repository: IInsuranceCertificateRepository) {}

  async execute(input: UpdateInsuranceCertificateInput): Promise<InsuranceCertificate> {
    const existing = await this.repository.findById(input.id);

    if (!existing) {
      throw new Error('Insurance certificate not found');
    }

    const updated = InsuranceCertificate.create({
      id: existing.id,
      propertyId: existing.propertyId,
      startDate: input.startDate !== undefined ? input.startDate : existing.startDate,
      endDate: input.endDate !== undefined ? input.endDate : existing.endDate,
      documentPath: input.documentPath !== undefined ? input.documentPath : existing.documentPath,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    return await this.repository.update(updated);
  }
}
