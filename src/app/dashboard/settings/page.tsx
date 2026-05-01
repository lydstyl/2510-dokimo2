import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/auth/session'
import { prisma } from '@/infrastructure/database/prisma'
import { getTranslations } from 'next-intl/server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const t = await getTranslations('settings')
  const tNav = await getTranslations('navigation')

  const apiKeys = await prisma.apiKey.findMany({
    where: { revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, prefix: true, createdAt: true },
  })

  const initialKeys = apiKeys.map(k => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    createdAt: k.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                {tNav('backToDashboard')}
              </a>
              <h1 className="text-xl font-bold">{t('title')}</h1>
            </div>
            <span className="text-sm text-gray-600">{session.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsClient initialKeys={initialKeys} />
      </main>
    </div>
  )
}
