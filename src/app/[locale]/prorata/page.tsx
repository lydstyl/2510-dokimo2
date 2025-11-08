import { getTranslations } from 'next-intl/server'
import { getSession } from '@/infrastructure/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProrataCalculator } from '@/features/prorata/presentation/components/ProrataCalculator'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'prorata' })

  return {
    title: t('title'),
  }
}

export default async function ProrataPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const t = await getTranslations('prorata')
  const tNav = await getTranslations('navigation')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {tNav('backToDashboard')}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('heading')}
          </h1>
        </div>

        {/* Calculator */}
        <ProrataCalculator />
      </div>
    </div>
  )
}
