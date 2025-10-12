import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';

export default async function LandlordsPage() {
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
              <h1 className="text-xl font-bold">Landlords</h1>
            </div>
            <span className="text-sm text-gray-600">{session.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Manage Landlords</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              + Add Landlord
            </button>
          </div>

          <div className="text-gray-600">
            <p className="mb-4">
              Landlords are property owners who rent out their properties. They can be:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>Natural Person</strong>: An individual property owner</li>
              <li><strong>Legal Entity</strong>: A company or SCI (Société Civile Immobilière)</li>
            </ul>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">API Endpoints:</h3>
              <ul className="space-y-1 text-sm font-mono bg-gray-50 p-3 rounded">
                <li>GET /api/landlords - List all landlords</li>
                <li>POST /api/landlords - Create a new landlord</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm">
                💡 <strong>Note:</strong> This is a placeholder page. The full CRUD interface will be implemented next.
                For now, you can interact with landlords via the API endpoints.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
