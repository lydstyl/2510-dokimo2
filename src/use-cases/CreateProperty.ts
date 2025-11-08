import { Property, PropertyType } from '../domain/entities/Property'
import { IPropertyRepository } from './interfaces/IPropertyRepository'
import { randomUUID } from 'crypto'

export interface CreatePropertyInput {
  name: string
  type: PropertyType
  address: string
  postalCode: string
  city: string
  landlordId: string
  note: string
}

export class CreateProperty {
  constructor(private propertyRepository: IPropertyRepository) {}

  async execute(input: CreatePropertyInput): Promise<Property> {
    const property = Property.create({
      id: randomUUID(),
      name: input.name,
      type: input.type,
      address: input.address,
      postalCode: input.postalCode,
      city: input.city,
      landlordId: input.landlordId,
      note: input.note,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return this.propertyRepository.create(property)
  }
}
