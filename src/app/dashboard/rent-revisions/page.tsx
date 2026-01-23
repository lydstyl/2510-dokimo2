import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';
import { getTranslations } from 'next-intl/server';
import { RentRevisionsClient } from './RentRevisionsClient';

export default async function RentRevisionsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const t = await getTranslations('rentRevisions');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Retour au dashboard
              </a>
              <h1 className="text-xl font-bold">{t('title')}</h1>
            </div>
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
        <RentRevisionsClient />
      </main>
    </div>
  );
}
