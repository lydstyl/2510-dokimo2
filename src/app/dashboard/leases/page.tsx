import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function LeasesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const leases = await prisma.lease.findMany({
    include: {
      property: {
        include: {
          landlord: true,
        },
      },
      tenant: true,
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
    orderBy: {
      startDate: 'desc',
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
              <h1 className="text-xl font-bold">Leases</h1>
            </div>
            <span className="text-sm text-gray-600">{session.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Manage Leases</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              + Create Lease
            </button>
          </div>

          {leases.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No leases found. Create your first lease to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leases.map((lease) => {
                const totalPaid = lease.payments.reduce((sum, payment) => sum + payment.amount, 0);
                const monthlyTotal = lease.rentAmount + lease.chargesAmount;
                const isActive = !lease.endDate;
                const lastPayment = lease.payments[0];

                return (
                  <div key={lease.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lease.property.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {lease.property.address}, {lease.property.postalCode} {lease.property.city}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive ? 'Active' : 'Ended'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Tenant</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lease.tenant.firstName} {lease.tenant.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Landlord</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lease.property.landlord.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                        <p className="text-sm font-medium text-gray-900">
                          €{monthlyTotal.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          (€{lease.rentAmount} + €{lease.chargesAmount} charges)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Due</p>
                        <p className="text-sm font-medium text-gray-900">
                          Day {lease.paymentDueDay} of month
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Start Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(lease.startDate).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">End Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lease.endDate ? new Date(lease.endDate).toLocaleDateString('en-GB') : 'Open-ended'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Payments</p>
                        <p className="text-sm font-medium text-gray-900">
                          €{totalPaid.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lease.payments.length} payment{lease.payments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Payment</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lastPayment
                            ? new Date(lastPayment.paymentDate).toLocaleDateString('en-GB')
                            : 'No payments yet'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button className="text-sm text-blue-600 hover:text-blue-900 font-medium">
                        View Details
                      </button>
                      <button className="text-sm text-blue-600 hover:text-blue-900 font-medium">
                        Record Payment
                      </button>
                      <button className="text-sm text-blue-600 hover:text-blue-900 font-medium">
                        View Payments
                      </button>
                      <button className="text-sm text-gray-600 hover:text-gray-900 font-medium ml-auto">
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
