import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';

export default async function TenantsPage() {
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

          <div className="text-gray-600">
            <p className="mb-4">
              Tenants are individuals who rent properties from landlords.
            </p>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">Tenant Information:</h3>
              <p className="text-sm mb-2">Each tenant record includes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                <li>First name and last name</li>
                <li>Contact information (email, phone)</li>
              </ul>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">Related Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>View all leases associated with a tenant</li>
                <li>Check payment history</li>
                <li>Monitor payment status (up-to-date or late)</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm">
                💡 <strong>Note:</strong> This is a placeholder page. The full CRUD interface will be implemented next.
                Tenants are linked to properties through lease contracts.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
