import { InsuranceCertificate } from '../../domain/InsuranceCertificate';

export interface IInsuranceCertificateRepository {
  findById(id: string): Promise<InsuranceCertificate | null>;
  findByLeaseId(leaseId: string): Promise<InsuranceCertificate[]>;
  findLatestByLeaseId(leaseId: string): Promise<InsuranceCertificate | null>;
  findAll(): Promise<InsuranceCertificate[]>;
  create(certificate: InsuranceCertificate): Promise<InsuranceCertificate>;
  update(certificate: InsuranceCertificate): Promise<InsuranceCertificate>;
  delete(id: string): Promise<void>;
}
