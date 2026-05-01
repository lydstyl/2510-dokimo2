import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/infrastructure/auth/session'
import { prisma } from '@/infrastructure/database/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const apiKey = await prisma.apiKey.findUnique({ where: { id } })
  if (!apiKey || apiKey.revokedAt) {
    return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
  }

  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
