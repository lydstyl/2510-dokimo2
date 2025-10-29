import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const t = await getTranslations('dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.email}</span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  {(await getTranslations('navigation'))('logout')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard title={t('cards.landlords.title')} description={t('cards.landlords.description')} href="/dashboard/landlords" />
          <DashboardCard title={t('cards.properties.title')} description={t('cards.properties.description')} href="/dashboard/properties" />
          <DashboardCard title={t('cards.tenants.title')} description={t('cards.tenants.description')} href="/dashboard/tenants" />
          <DashboardCard title={t('cards.leases.title')} description={t('cards.leases.description')} href="/dashboard/leases" />
          <DashboardCard title={t('cards.boilers.title')} description={t('cards.boilers.description')} href="/dashboard/boilers" />
          <DashboardCard title="Immeubles" description="Gérer les immeubles et les charges" href="/dashboard/buildings" />
          <DashboardCard title="États des lieux" description="Templates et états des lieux" href="/dashboard/inventory-templates" />
        </div>

        <div className="mb-8">
          <a
            href="/dashboard/quick-rent-overview"
            className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{t('cards.quickRent.title')}</h3>
            <p className="text-blue-100">{t('cards.quickRent.description')}</p>
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('welcome')}</h2>
          <p className="text-gray-600">
            {t('instruction')}
          </p>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </a>
  );
}
