import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';

export default async function LeasesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

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

          <div className="text-gray-600">
            <p className="mb-4">
              Leases (Baux) are rental contracts that link properties with tenants.
            </p>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">Lease Details:</h3>
              <p className="text-sm mb-2">Each lease contains:</p>
              <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                <li><strong>Property</strong>: The rented property</li>
                <li><strong>Tenant</strong>: The person renting</li>
                <li><strong>Start date</strong>: When the lease begins</li>
                <li><strong>End date</strong>: When the lease ends (optional for open-ended leases)</li>
                <li><strong>Rent amount</strong>: Monthly rent excluding charges</li>
                <li><strong>Charges amount</strong>: Monthly charges (utilities, maintenance, etc.)</li>
                <li><strong>Payment due day</strong>: Day of the month when payment is due (1-31)</li>
              </ul>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">Available Actions:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                <li>Record rent payments</li>
                <li>Generate rent receipts (quittances de loyer)</li>
                <li>Generate rent due notices (avis d'échéance)</li>
                <li>Check payment status</li>
                <li>Export payment history to CSV</li>
              </ul>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">API Endpoints:</h3>
              <ul className="space-y-1 text-sm font-mono bg-gray-50 p-3 rounded">
                <li>GET /api/leases - List active leases</li>
                <li>GET /api/leases?propertyId=xxx - List leases by property</li>
                <li>GET /api/leases?tenantId=xxx - List leases by tenant</li>
                <li>POST /api/leases - Create a new lease</li>
                <li>GET /api/payments?leaseId=xxx - List payments for a lease</li>
                <li>POST /api/payments - Record a payment</li>
                <li>GET /api/payments/export/[leaseId] - Export payments as CSV</li>
                <li>GET /api/documents/rent-receipt/[paymentId] - Generate rent receipt</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm">
                💡 <strong>Note:</strong> This is a placeholder page. The full lease management interface
                with payment tracking and document generation will be implemented next.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
