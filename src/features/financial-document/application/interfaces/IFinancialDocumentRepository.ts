import { FinancialDocument } from '../../domain/FinancialDocument';

export interface IFinancialDocumentRepository {
  findById(id: string): Promise<FinancialDocument | null>;
  findByBuildingId(buildingId: string): Promise<FinancialDocument[]>;
  create(document: FinancialDocument): Promise<FinancialDocument>;
  update(document: FinancialDocument): Promise<FinancialDocument>;
  delete(id: string): Promise<void>;
}
