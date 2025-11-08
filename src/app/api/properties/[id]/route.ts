import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/infrastructure/auth/session'
import { prisma } from '@/infrastructure/database/prisma'
import { PrismaPropertyRepository } from '@/infrastructure/repositories/PrismaPropertyRepository'
import { UpdateProperty } from '@/use-cases/UpdateProperty'
import { DeleteProperty } from '@/use-cases/DeleteProperty'
import { PropertyType } from '@/domain/entities/Property'

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
    const { name, type, address, postalCode, city, landlordId, note } = body

    if (!name || !type || !address || !postalCode || !city || !landlordId) {
      return NextResponse.json(
        {
          error:
            'Name, type, address, postal code, city, and landlord are required'
        },
        { status: 400 }
      )
    }

    const repository = new PrismaPropertyRepository(prisma)
    const useCase = new UpdateProperty(repository)

    const property = await useCase.execute({
      id,
      name,
      type: type as PropertyType,
      address,
      postalCode,
      city,
      landlordId,
      note
    })

    return NextResponse.json({
      id: property.id,
      name: property.name,
      type: property.type,
      address: property.address,
      postalCode: property.postalCode,
      city: property.city,
      landlordId: property.landlordId,
      note: property.note,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt
    })
  } catch (error: any) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Property not found' ? 404 : 400 }
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

    const repository = new PrismaPropertyRepository(prisma)
    const useCase = new DeleteProperty(repository)

    await useCase.execute({ id })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Property not found' ? 404 : 400 }
    )
  }
}
