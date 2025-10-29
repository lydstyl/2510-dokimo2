import { PropertyChargeShare } from '../../domain/PropertyChargeShare';
import { DocumentCategory } from '../../domain/FinancialDocument';

export interface IPropertyChargeShareRepository {
  findById(id: string): Promise<PropertyChargeShare | null>;
  findByPropertyId(propertyId: string): Promise<PropertyChargeShare[]>;
  findByPropertyIdAndCategory(propertyId: string, category: DocumentCategory): Promise<PropertyChargeShare | null>;
  findByBuildingId(buildingId: string): Promise<PropertyChargeShare[]>;
  create(share: PropertyChargeShare): Promise<PropertyChargeShare>;
  update(share: PropertyChargeShare): Promise<PropertyChargeShare>;
  delete(id: string): Promise<void>;
  upsert(propertyId: string, category: DocumentCategory, percentage: number): Promise<PropertyChargeShare>;
}
