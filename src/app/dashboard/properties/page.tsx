import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';

export default async function PropertiesPage() {
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
              <h1 className="text-xl font-bold">Properties</h1>
            </div>
            <span className="text-sm text-gray-600">{session.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Manage Properties</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              + Add Property
            </button>
          </div>

          <div className="text-gray-600">
            <p className="mb-4">
              Properties are rental units owned by landlords. Property types include:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>Apartment</strong>: Residential apartment unit</li>
              <li><strong>House</strong>: Standalone residential house</li>
              <li><strong>Garage</strong>: Parking or storage garage</li>
              <li><strong>Parking</strong>: Parking space</li>
              <li><strong>Commercial</strong>: Commercial property</li>
              <li><strong>Other</strong>: Any other type of property</li>
            </ul>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">Key Information:</h3>
              <p className="text-sm mb-2">Each property contains:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Name and type</li>
                <li>Complete address (street, postal code, city)</li>
                <li>Associated landlord</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm">
                💡 <strong>Note:</strong> This is a placeholder page. The full CRUD interface will be implemented next.
                You can create properties via API and associate them with landlords.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
