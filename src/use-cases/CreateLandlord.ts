import { Landlord, LandlordType } from '../domain/entities/Landlord'
import { Email } from '../domain/value-objects/Email'
import { ILandlordRepository } from './interfaces/ILandlordRepository'
import { randomUUID } from 'crypto'

export interface CreateLandlordInput {
  name: string
  type: LandlordType
  address: string
  email?: string
  phone?: string
  siret?: string
  managerName?: string
  managerEmail?: string
  managerPhone?: string
  note?: string
  userId: string
}

export class CreateLandlord {
  constructor(private landlordRepository: ILandlordRepository) {}

  async execute(input: CreateLandlordInput): Promise<Landlord> {
    const landlord = Landlord.create({
      id: randomUUID(),
      name: input.name,
      type: input.type,
      address: input.address,
      email: input.email ? Email.create(input.email) : undefined,
      phone: input.phone,
      siret: input.siret,
      managerName: input.managerName,
      managerEmail: input.managerEmail
        ? Email.create(input.managerEmail)
        : undefined,
      managerPhone: input.managerPhone,
      note: input.note,
      userId: input.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return this.landlordRepository.create(landlord)
  }
}
