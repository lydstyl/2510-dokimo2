import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';
import { PrismaClient } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { TenantsClient } from './TenantsClient';

const prisma = new PrismaClient();

export default async function TenantsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const t = await getTranslations('tenants');
  const tNav = await getTranslations('navigation');

  const tenantsData = await prisma.tenant.findMany({
    include: {
      leases: {
        include: {
          property: true,
          payments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert null to undefined for email and phone
  const tenants = tenantsData.map(tenant => ({
    ...tenant,
    email: tenant.email ?? undefined,
    phone: tenant.phone ?? undefined,
  }));

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TenantsClient initialTenants={tenants} />
      </main>
    </div>
  );
}
