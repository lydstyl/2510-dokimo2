import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function TenantsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const tenants = await prisma.tenant.findMany({
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </a>
              <h1 className="text-xl font-bold">Tenants</h1>
            </div>
            <span className="text-sm text-gray-600">{session.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Manage Tenants</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              + Add Tenant
            </button>
          </div>

          {tenants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No tenants found. Create your first tenant to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Leases</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant) => {
                    const activeLeases = tenant.leases.filter(lease => !lease.endDate);
                    const totalPayments = tenant.leases.reduce(
                      (sum, lease) => sum + lease.payments.reduce((s, p) => s + p.amount, 0),
                      0
                    );

                    return (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {tenant.firstName} {tenant.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{tenant.email || '-'}</div>
                          <div className="text-xs text-gray-500">{tenant.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {activeLeases.length > 0 ? (
                            <div>
                              {activeLeases.map((lease) => (
                                <div key={lease.id} className="text-sm text-gray-900 mb-1">
                                  {lease.property.name}
                                  <span className="ml-2 text-xs text-gray-500">
                                    €{lease.rentAmount + lease.chargesAmount}/mo
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No active leases</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">€{totalPayments.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {tenant.leases.reduce((sum, lease) => sum + lease.payments.length, 0)} payments
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
