import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSession } from '@/infrastructure/auth/session'
import { prisma } from '@/infrastructure/database/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, prefix: true, createdAt: true },
  })

  return NextResponse.json(keys)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })

  const key = 'mcp_' + randomBytes(32).toString('hex')
  const prefix = key.slice(0, 12)

  const created = await prisma.apiKey.create({
    data: { name, key, prefix },
  })

  return NextResponse.json(
    { id: created.id, name: created.name, prefix: created.prefix, createdAt: created.createdAt, key },
    { status: 201 }
  )
}
