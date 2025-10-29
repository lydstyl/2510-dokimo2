'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Diagnostic {
  id: string;
  name: string;
  diagnosticDate: string;
  expiryDate: string;
  pdfPath: string;
  isValid: boolean;
  daysUntilExpiry: number;
}

interface Props {
  propertyId: string;
}

export function DiagnosticStatus({ propertyId }: Props) {
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiagnostics();
  }, [propertyId]);

  const fetchDiagnostics = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/diagnostics`);
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data);
      }
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (diagnostics.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        <span>Aucun diagnostic</span>
        <button
          onClick={() => router.push(`/dashboard/properties/${propertyId}/diagnostics`)}
          className="ml-2 text-blue-600 hover:text-blue-800"
        >
          + Ajouter
        </button>
      </div>
    );
  }

  const validDiagnostics = diagnostics.filter((d) => d.isValid);
  const expiredDiagnostics = diagnostics.filter((d) => !d.isValid);
  const soonToExpire = diagnostics.filter((d) => d.isValid && d.daysUntilExpiry <= 90);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">
          {diagnostics.length} diagnostic{diagnostics.length > 1 ? 's' : ''}
        </span>
        {expiredDiagnostics.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
            ⚠️ {expiredDiagnostics.length} expiré{expiredDiagnostics.length > 1 ? 's' : ''}
          </span>
        )}
        {soonToExpire.length > 0 && expiredDiagnostics.length === 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
            {soonToExpire.length} à renouveler
          </span>
        )}
        {expiredDiagnostics.length === 0 && soonToExpire.length === 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
            ✓ Tous valides
          </span>
        )}
      </div>
      <button
        onClick={() => router.push(`/dashboard/properties/${propertyId}/diagnostics`)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        Voir les diagnostics →
      </button>
    </div>
  );
}
