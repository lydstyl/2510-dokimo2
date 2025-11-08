import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/infrastructure/auth/session'
import { prisma } from '@/infrastructure/database/prisma'
import { PrismaLandlordRepository } from '@/infrastructure/repositories/PrismaLandlordRepository'
import { UpdateLandlord } from '@/use-cases/UpdateLandlord'
import { DeleteLandlord } from '@/use-cases/DeleteLandlord'
import { LandlordType } from '@/domain/entities/Landlord'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const repository = new PrismaLandlordRepository(prisma)
    const landlord = await repository.findById(id)

    if (!landlord) {
      return NextResponse.json({ error: 'Landlord not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: landlord.id,
      name: landlord.name,
      type: landlord.type,
      address: landlord.address,
      email: landlord.email?.getValue(),
      phone: landlord.phone,
      siret: landlord.siret,
      managerName: landlord.managerName,
      managerEmail: landlord.managerEmail?.getValue(),
      managerPhone: landlord.managerPhone,
      note: landlord.note,
      createdAt: landlord.createdAt,
      updatedAt: landlord.updatedAt
    })
  } catch (error: any) {
    console.error('Error fetching landlord:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      type,
      address,
      email,
      phone,
      siret,
      managerName,
      managerEmail,
      managerPhone,
      note
    } = body

    if (!name || !type || !address) {
      return NextResponse.json(
        { error: 'Name, type, and address are required' },
        { status: 400 }
      )
    }

    const repository = new PrismaLandlordRepository(prisma)
    const useCase = new UpdateLandlord(repository)

    const landlord = await useCase.execute({
      id,
      name,
      type: type as LandlordType,
      address,
      email,
      phone,
      siret,
      managerName,
      managerEmail,
      managerPhone,
      note,
      userId: session.userId
    })

    return NextResponse.json({
      id: landlord.id,
      name: landlord.name,
      type: landlord.type,
      address: landlord.address,
      email: landlord.email?.getValue(),
      phone: landlord.phone,
      siret: landlord.siret,
      managerName: landlord.managerName,
      managerEmail: landlord.managerEmail?.getValue(),
      managerPhone: landlord.managerPhone,
      note: landlord.note,
      createdAt: landlord.createdAt,
      updatedAt: landlord.updatedAt
    })
  } catch (error: any) {
    console.error('Error updating landlord:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      {
        status:
          error.message === 'Landlord not found'
            ? 404
            : error.message === 'Unauthorized to update this landlord'
            ? 403
            : 400
      }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const repository = new PrismaLandlordRepository(prisma)
    const useCase = new DeleteLandlord(repository)

    await useCase.execute({
      id,
      userId: session.userId
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting landlord:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      {
        status:
          error.message === 'Landlord not found'
            ? 404
            : error.message === 'Unauthorized to delete this landlord'
            ? 403
            : 400
      }
    )
  }
}
