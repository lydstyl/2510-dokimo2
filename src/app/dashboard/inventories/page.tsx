'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InventoryOverview {
  id: string;
  type: string;
  inventoryDate: string;
  pdfPath: string | null;
  property: {
    id: string;
    name: string;
    address: string;
    landlordName: string;
  };
  tenant: {
    name: string;
  } | null;
}

export default function InventoriesPage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<InventoryOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/inventories/overview');
      if (response.ok) {
        const data = await response.json();
        setInventories(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ENTRY':
        return { className: 'bg-green-100 text-green-800', text: 'Entrée' };
      case 'EXIT':
        return { className: 'bg-blue-100 text-blue-800', text: 'Sortie' };
      default:
        return { className: 'bg-gray-100 text-gray-800', text: type };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const entryCount = inventories.filter((inv) => inv.type === 'ENTRY').length;
  const exitCount = inventories.filter((inv) => inv.type === 'EXIT').length;

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
              <h1 className="text-xl font-bold">États des lieux</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard/inventory-templates')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Gérer les templates
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{inventories.length}</div>
            <div className="text-sm text-gray-600">États des lieux totaux</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-800">{entryCount}</div>
            <div className="text-sm text-green-600">États d'entrée</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-800">{exitCount}</div>
            <div className="text-sm text-blue-600">États de sortie</div>
          </div>
        </div>

        {/* Inventories List */}
        {inventories.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aucun état des lieux enregistré.</p>
            <button
              onClick={() => router.push('/dashboard/properties')}
              className="text-blue-600 hover:text-blue-800"
            >
              Créer des états des lieux depuis les biens →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Locataire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    PDF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventories.map((inventory) => {
                  const badge = getTypeBadge(inventory.type);
                  return (
                    <tr key={inventory.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {inventory.property.name}
                        </div>
                        <div className="text-xs text-gray-500">{inventory.property.address}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {inventory.tenant ? inventory.tenant.name : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(inventory.inventoryDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {inventory.pdfPath ? (
                          <a
                            href={inventory.pdfPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            📄 Télécharger
                          </a>
                        ) : (
                          <span className="text-gray-400">Non généré</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/properties/${inventory.property.id}/inventories`)
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Gérer →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
