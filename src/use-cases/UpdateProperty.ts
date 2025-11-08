import { Property, PropertyType } from '../domain/entities/Property'
import { IPropertyRepository } from './interfaces/IPropertyRepository'

export interface UpdatePropertyInput {
  id: string
  name: string
  type: PropertyType
  address: string
  postalCode: string
  city: string
  landlordId: string
  note: string
}

export class UpdateProperty {
  constructor(private propertyRepository: IPropertyRepository) {}

  async execute(input: UpdatePropertyInput): Promise<Property> {
    // Check if property exists
    const existingProperty = await this.propertyRepository.findById(input.id)
    if (!existingProperty) {
      throw new Error('Property not found')
    }

    const property = Property.create({
      id: input.id,
      name: input.name,
      type: input.type,
      address: input.address,
      postalCode: input.postalCode,
      city: input.city,
      landlordId: input.landlordId,
      note: input.note,
      createdAt: existingProperty.createdAt,
      updatedAt: new Date()
    })

    return this.propertyRepository.update(property)
  }
}
