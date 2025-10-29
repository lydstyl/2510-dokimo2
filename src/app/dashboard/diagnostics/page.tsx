'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DiagnosticOverview {
  id: string;
  name: string;
  diagnosticDate: string;
  expiryDate: string;
  pdfPath: string;
  property: {
    id: string;
    name: string;
    address: string;
    landlordName: string;
  };
  isValid: boolean;
  daysUntilExpiry: number;
}

export default function DiagnosticsPage() {
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<DiagnosticOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/diagnostics/overview');
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getValidityBadge = (diagnostic: DiagnosticOverview) => {
    if (!diagnostic.isValid) {
      return {
        className: 'bg-red-100 text-red-800 font-semibold',
        text: `⚠️ Expiré depuis ${Math.abs(diagnostic.daysUntilExpiry)} jours`,
      };
    }
    if (diagnostic.daysUntilExpiry <= 30) {
      return {
        className: 'bg-red-100 text-red-800 font-semibold',
        text: `⚠️ Expire dans ${diagnostic.daysUntilExpiry} jours`,
      };
    }
    if (diagnostic.daysUntilExpiry <= 90) {
      return {
        className: 'bg-orange-100 text-orange-800',
        text: `À renouveler (${diagnostic.daysUntilExpiry} jours)`,
      };
    }
    return {
      className: 'bg-green-100 text-green-800',
      text: `✓ Valide (${diagnostic.daysUntilExpiry} jours)`,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const expiredCount = diagnostics.filter((d) => !d.isValid).length;
  const expiringSoonCount = diagnostics.filter((d) => d.isValid && d.daysUntilExpiry <= 90).length;
  const validCount = diagnostics.filter((d) => d.isValid && d.daysUntilExpiry > 90).length;

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
              <h1 className="text-xl font-bold">Diagnostics immobiliers</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{diagnostics.length}</div>
            <div className="text-sm text-gray-600">Diagnostics totaux</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-800">{validCount}</div>
            <div className="text-sm text-green-600">Valides</div>
          </div>
          {expiringSoonCount > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-800">{expiringSoonCount}</div>
              <div className="text-sm text-orange-600">À renouveler</div>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-800">{expiredCount}</div>
              <div className="text-sm text-red-600">Expirés</div>
            </div>
          )}
        </div>

        {/* Diagnostics List */}
        {diagnostics.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aucun diagnostic enregistré.</p>
            <button
              onClick={() => router.push('/dashboard/properties')}
              className="text-blue-600 hover:text-blue-800"
            >
              Gérer les diagnostics depuis les biens →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Diagnostic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Propriétaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date du diagnostic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date d'expiration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {diagnostics.map((diagnostic) => {
                  const badge = getValidityBadge(diagnostic);
                  return (
                    <tr key={diagnostic.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {diagnostic.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {diagnostic.property.name}
                        </div>
                        <div className="text-xs text-gray-500">{diagnostic.property.address}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {diagnostic.property.landlordName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(diagnostic.diagnosticDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(diagnostic.expiryDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <a
                          href={diagnostic.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          📄 PDF
                        </a>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/properties/${diagnostic.property.id}/diagnostics`
                            )
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
