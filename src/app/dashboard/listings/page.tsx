'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ListingOverview {
  id: string;
  title: string;
  description: string;
  status: string;
  property: {
    id: string;
    name: string;
    address: string;
    landlordName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/listings/overview');
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { className: 'bg-green-100 text-green-800', text: 'Active' };
      case 'INACTIVE':
        return { className: 'bg-gray-100 text-gray-800', text: 'Inactive' };
      case 'RENTED':
        return { className: 'bg-blue-100 text-blue-800', text: 'Louée' };
      default:
        return { className: 'bg-gray-100 text-gray-800', text: status };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const activeCount = listings.filter((l) => l.status === 'ACTIVE').length;
  const inactiveCount = listings.filter((l) => l.status === 'INACTIVE').length;
  const rentedCount = listings.filter((l) => l.status === 'RENTED').length;

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
              <h1 className="text-xl font-bold">Publications / Annonces</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{listings.length}</div>
            <div className="text-sm text-gray-600">Publications totales</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-800">{activeCount}</div>
            <div className="text-sm text-green-600">Actives</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-800">{inactiveCount}</div>
            <div className="text-sm text-gray-600">Inactives</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-800">{rentedCount}</div>
            <div className="text-sm text-blue-600">Louées</div>
          </div>
        </div>

        {/* Listings List */}
        {listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aucune publication enregistrée.</p>
            <button
              onClick={() => router.push('/dashboard/properties')}
              className="text-blue-600 hover:text-blue-800"
            >
              Créer des publications depuis les biens →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const badge = getStatusBadge(listing.status);
              return (
                <div
                  key={listing.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{listing.title}</h3>
                        <span
                          className={`inline-block px-3 py-1 rounded text-sm font-medium ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{listing.description}</p>
                      <div className="text-sm text-gray-600">
                        <div className="font-medium">{listing.property.name}</div>
                        <div className="text-xs text-gray-500">{listing.property.address}</div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/properties/${listing.property.id}/listings`)
                        }
                        className="text-blue-600 hover:text-blue-900 px-3 py-1"
                      >
                        Gérer →
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">
                    Créée le {new Date(listing.createdAt).toLocaleDateString('fr-FR')}
                    {listing.updatedAt !== listing.createdAt && (
                      <> • Modifiée le {new Date(listing.updatedAt).toLocaleDateString('fr-FR')}</>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
