'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const CHARGE_CATEGORIES = {
  ELECTRICITY: 'Électricité',
  CLEANING: 'Ménage',
  GARBAGE_TAX: 'Taxe ordures ménagères',
  HEATING: 'Chauffage',
  ELEVATOR: 'Ascenseur',
  COMMON_AREA_MAINTENANCE: 'Entretien espaces communs',
  // WATER is excluded - calculated automatically based on consumption
};

interface PropertyChargeShare {
  propertyId: string;
  propertyName: string;
  shares: {
    id: string;
    category: string;
    percentage: number;
  }[];
}

export default function ChargeConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;

  const [propertiesShares, setPropertiesShares] = useState<PropertyChargeShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchChargeShares();
  }, [buildingId]);

  const fetchChargeShares = async () => {
    try {
      const response = await fetch(`/api/buildings/${buildingId}/charge-shares`);
      if (response.ok) {
        const data = await response.json();
        setPropertiesShares(data);
      }
    } catch (error) {
      console.error('Error fetching charge shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (propertyId: string, category: string): number => {
    const property = propertiesShares.find((p) => p.propertyId === propertyId);
    if (!property) return 0;

    const share = property.shares.find((s) => s.category === category);
    return share ? share.percentage : 0;
  };

  const handlePercentageChange = async (
    propertyId: string,
    category: string,
    value: string
  ) => {
    const percentage = parseFloat(value) || 0;

    // Update local state optimistically
    setPropertiesShares((prev) =>
      prev.map((prop) => {
        if (prop.propertyId !== propertyId) return prop;

        const existingShare = prop.shares.find((s) => s.category === category);
        if (existingShare) {
          return {
            ...prop,
            shares: prop.shares.map((s) =>
              s.category === category ? { ...s, percentage } : s
            ),
          };
        } else {
          return {
            ...prop,
            shares: [...prop.shares, { id: '', category, percentage }],
          };
        }
      })
    );

    // Save to backend
    try {
      await fetch(`/api/buildings/${buildingId}/charge-shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, category, percentage }),
      });
    } catch (error) {
      console.error('Error saving charge share:', error);
      // Optionally: revert optimistic update on error
    }
  };

  const calculateCategoryTotal = (category: string): number => {
    return propertiesShares.reduce((sum, prop) => {
      const share = prop.shares.find((s) => s.category === category);
      return sum + (share ? share.percentage : 0);
    }, 0);
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  if (propertiesShares.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-8">
          <button
            onClick={() => router.push(`/dashboard/buildings/${buildingId}`)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour à l'immeuble
          </button>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">
              Aucun bien dans cet immeuble. Ajoutez des biens pour configurer les charges.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/buildings/${buildingId}`)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour à l'immeuble
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Configuration des charges
          </h1>
          <p className="text-gray-600 mt-2">
            Définissez le pourcentage de charges par bien et par catégorie
          </p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Information importante</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Les pourcentages doivent être définis pour chaque bien et chaque catégorie de
                charges
              </li>
              <li>
                • La <strong>somme des pourcentages par catégorie</strong> devrait généralement
                être égale à 100%
              </li>
              <li>
                • L'<strong>eau</strong> est calculée automatiquement selon la consommation
                réelle (relevés de compteur)
              </li>
              <li>
                • Les modifications sont enregistrées automatiquement
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Bien
                </th>
                {Object.entries(CHARGE_CATEGORIES).map(([key, label]) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {propertiesShares.map((property) => (
                <tr key={property.propertyId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    {property.propertyName}
                  </td>
                  {Object.keys(CHARGE_CATEGORIES).map((category) => (
                    <td key={category} className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={getPercentage(property.propertyId, category)}
                          onChange={(e) =>
                            handlePercentageChange(
                              property.propertyId,
                              category,
                              e.target.value
                            )
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-1 text-gray-500">%</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-gray-100">
                  Total
                </td>
                {Object.keys(CHARGE_CATEGORIES).map((category) => {
                  const total = calculateCategoryTotal(category);
                  const isValid = Math.abs(total - 100) < 0.01; // Allow small rounding errors
                  return (
                    <td
                      key={category}
                      className={`px-6 py-4 whitespace-nowrap text-center text-sm ${
                        isValid
                          ? 'text-green-700 bg-green-50'
                          : total > 0
                          ? 'text-orange-700 bg-orange-50'
                          : 'text-gray-500'
                      }`}
                    >
                      {total.toFixed(2)}%
                      {isValid && ' ✓'}
                      {!isValid && total > 0 && ' ⚠️'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">💧 Charges d'eau</h3>
          <p className="text-sm text-yellow-800">
            Les charges d'eau ne sont pas configurées ici car elles sont calculées
            automatiquement en fonction de la <strong>consommation réelle</strong> de chaque
            locataire (basée sur les relevés de compteur d'eau).
          </p>
          <p className="text-sm text-yellow-800 mt-2">
            Le système utilisera les relevés des 12 derniers mois pour déterminer la part d'eau
            de chaque bien dans la régularisation des charges.
          </p>
        </div>
      </div>
    </main>
  );
}
