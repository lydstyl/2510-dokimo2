'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WaterMeterOverview {
  property: {
    id: string;
    name: string;
    address: string;
    landlordName: string;
  };
  latestReading: {
    id: string;
    readingDate: string;
    value: number;
    photoPath: string | null;
    createdAt: string;
  } | null;
}

export default function WaterMetersPage() {
  const router = useRouter();
  const [waterMeters, setWaterMeters] = useState<WaterMeterOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/water-meters/overview');
      if (response.ok) {
        const data = await response.json();
        setWaterMeters(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const propertiesWithReadings = waterMeters.filter((wm) => wm.latestReading !== null).length;
  const propertiesWithoutReadings = waterMeters.filter((wm) => wm.latestReading === null).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Retour au Dashboard
              </button>
              <h1 className="text-xl font-bold">Compteurs d'eau</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{waterMeters.length}</div>
            <div className="text-sm text-gray-600">Biens totaux</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-800">{propertiesWithReadings}</div>
            <div className="text-sm text-green-600">Avec relevés</div>
          </div>
          {propertiesWithoutReadings > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-800">{propertiesWithoutReadings}</div>
              <div className="text-sm text-orange-600">Sans relevés</div>
            </div>
          )}
        </div>

        {/* Water Meters List */}
        {waterMeters.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Aucun bien avec compteur d'eau.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Propriétaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dernier relevé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Valeur (m³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waterMeters.map((wm) => (
                  <tr key={wm.property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{wm.property.name}</div>
                      <div className="text-xs text-gray-500">{wm.property.address}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{wm.property.landlordName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {wm.latestReading ? (
                        <div>
                          {new Date(wm.latestReading.readingDate).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <span className="text-gray-400">Aucun relevé</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {wm.latestReading ? (
                        <span className="font-medium">{wm.latestReading.value} m³</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => router.push(`/dashboard/properties/${wm.property.id}/water-meters`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Voir les relevés →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
