import { InsuranceCertificate } from '../../domain/InsuranceCertificate';

export interface IInsuranceCertificateRepository {
  findById(id: string): Promise<InsuranceCertificate | null>;
  findByPropertyId(propertyId: string): Promise<InsuranceCertificate[]>;
  findLatestByPropertyId(propertyId: string): Promise<InsuranceCertificate | null>;
  findAll(): Promise<InsuranceCertificate[]>;
  create(certificate: InsuranceCertificate): Promise<InsuranceCertificate>;
  update(certificate: InsuranceCertificate): Promise<InsuranceCertificate>;
  delete(id: string): Promise<void>;
}
