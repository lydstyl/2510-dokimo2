import { Landlord, LandlordType } from '../domain/entities/Landlord';
import { Email } from '../domain/value-objects/Email';
import { ILandlordRepository } from './interfaces/ILandlordRepository';

export interface UpdateLandlordInput {
  id: string;
  name: string;
  type: LandlordType;
  address: string;
  email?: string;
  phone?: string;
  siret?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  userId: string;
}

export class UpdateLandlord {
  constructor(private landlordRepository: ILandlordRepository) {}

  async execute(input: UpdateLandlordInput): Promise<Landlord> {
    // Check if landlord exists
    const existingLandlord = await this.landlordRepository.findById(input.id);
    if (!existingLandlord) {
      throw new Error('Landlord not found');
    }

    // Verify ownership
    if (existingLandlord.userId !== input.userId) {
      throw new Error('Unauthorized to update this landlord');
    }

    const landlord = Landlord.create({
      id: input.id,
      name: input.name,
      type: input.type,
      address: input.address,
      email: input.email ? Email.create(input.email) : undefined,
      phone: input.phone,
      siret: input.siret,
      managerName: input.managerName,
      managerEmail: input.managerEmail ? Email.create(input.managerEmail) : undefined,
      managerPhone: input.managerPhone,
      userId: input.userId,
      createdAt: existingLandlord.createdAt,
      updatedAt: new Date(),
    });

    return this.landlordRepository.update(landlord);
  }
}
