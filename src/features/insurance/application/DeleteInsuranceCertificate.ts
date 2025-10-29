import { IInsuranceCertificateRepository } from './interfaces/IInsuranceCertificateRepository';

export class DeleteInsuranceCertificate {
  constructor(private repository: IInsuranceCertificateRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error('Insurance certificate not found');
    }

    // Note: We do NOT delete the document file - we keep it for records
    await this.repository.delete(id);
  }
}
