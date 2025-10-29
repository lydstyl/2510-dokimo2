'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Property {
  id: string;
  name: string;
  type: string;
  address: string;
  landlord: {
    id: string;
    name: string;
  };
  activeLease: {
    tenant: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

interface Building {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  properties: Property[];
}

interface AvailableProperty {
  id: string;
  name: string;
  address: string;
}

export default function BuildingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;

  const [building, setBuilding] = useState<Building | null>(null);
  const [availableProperties, setAvailableProperties] = useState<AvailableProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  useEffect(() => {
    fetchBuilding();
    fetchAvailableProperties();
  }, [buildingId]);

  const fetchBuilding = async () => {
    try {
      const response = await fetch(`/api/buildings/${buildingId}`);
      if (response.ok) {
        const data = await response.json();
        setBuilding(data);
      } else if (response.status === 404) {
        router.push('/dashboard/buildings');
      }
    } catch (error) {
      console.error('Error fetching building:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (response.ok) {
        const data = await response.json();
        // Filter properties without a building
        const available = data.filter((p: any) => !p.buildingId);
        setAvailableProperties(available);
      }
    } catch (error) {
      console.error('Error fetching available properties:', error);
    }
  };

  const handleLinkProperty = async () => {
    if (!selectedPropertyId) return;

    try {
      const response = await fetch(`/api/buildings/${buildingId}/link-property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropertyId }),
      });

      if (response.ok) {
        await fetchBuilding();
        await fetchAvailableProperties();
        setShowLinkModal(false);
        setSelectedPropertyId('');
      }
    } catch (error) {
      console.error('Error linking property:', error);
    }
  };

  const handleUnlinkProperty = async (propertyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce bien de l\'immeuble ?')) return;

    try {
      const response = await fetch(`/api/buildings/${buildingId}/link-property`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      if (response.ok) {
        await fetchBuilding();
        await fetchAvailableProperties();
      }
    } catch (error) {
      console.error('Error unlinking property:', error);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!building) return <div className="p-8">Immeuble introuvable</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/buildings')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour aux immeubles
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{building.name}</h1>
              <p className="text-gray-600 mt-1">
                {building.address}, {building.postalCode} {building.city}
              </p>
            </div>
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Ajouter un bien
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button className="px-6 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
                Biens ({building.properties.length})
              </button>
              <button
                onClick={() => router.push(`/dashboard/buildings/${buildingId}/documents`)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900"
              >
                Documents financiers
              </button>
              <button
                onClick={() => router.push(`/dashboard/buildings/${buildingId}/charges`)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900"
              >
                Configuration charges
              </button>
              <button
                onClick={() => router.push(`/dashboard/buildings/${buildingId}/settlement`)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900"
              >
                Régularisation
              </button>
            </nav>
          </div>

          {/* Properties List */}
          <div className="p-6">
            {building.properties.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Aucun bien dans cet immeuble.</p>
                <p className="text-sm mt-2">
                  Ajoutez des biens pour gérer les charges communes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {building.properties.map((property) => (
                  <div
                    key={property.id}
                    className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{property.name}</h3>
                      <p className="text-sm text-gray-600">{property.address}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="bg-gray-100 px-2 py-1 rounded mr-2">
                          {property.type}
                        </span>
                        <span>Propriétaire: {property.landlord.name}</span>
                        {property.activeLease && (
                          <span className="ml-2">
                            • Locataire: {property.activeLease.tenant.firstName}{' '}
                            {property.activeLease.tenant.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnlinkProperty(property.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Property Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Ajouter un bien à l'immeuble</h3>
              {availableProperties.length === 0 ? (
                <p className="text-gray-600 mb-4">
                  Aucun bien disponible. Tous les biens sont déjà liés à un immeuble ou créez
                  d'abord de nouveaux biens.
                </p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sélectionnez un bien
                    </label>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choisir un bien --</option>
                      {availableProperties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name} - {property.address}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setSelectedPropertyId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                {availableProperties.length > 0 && (
                  <button
                    onClick={handleLinkProperty}
                    disabled={!selectedPropertyId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ajouter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
