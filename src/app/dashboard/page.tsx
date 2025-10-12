import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Rental Management</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.email}</span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard title="Landlords" href="/dashboard/landlords" />
          <DashboardCard title="Properties" href="/dashboard/properties" />
          <DashboardCard title="Tenants" href="/dashboard/tenants" />
          <DashboardCard title="Leases" href="/dashboard/leases" />
          <DashboardCard title="Payments" href="/dashboard/payments" />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Rental Management</h2>
          <p className="text-gray-600">
            Select a section from above to manage your rental properties, landlords, tenants, and leases.
          </p>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, href }: { title: string; href: string }) {
  return (
    <a
      href={href}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">Manage {title.toLowerCase()}</p>
    </a>
  );
}
